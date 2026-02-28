import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup) as (hostname: string, options?: dns.LookupOptions) => Promise<dns.LookupAddress[]>;

/**
 * Validates a URL against common SSRF and DNS Rebinding patterns.
 * @param url String URL to validate
 * @param context Name for logging context (e.g., 'Export', 'Scrape')
 * @returns { hostname: string, address: string } if valid
 * @throws Error if restricted or invalid
 */
export async function validateUrlSecurity(url: string, context: string) {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // 1. Static Hostname Checks (Protects against literal IP and known cloud metadata endpoints)
    // Block IPv6 shorthand [::]/loopback [::1] and private ranges
    const isIPv6Internal = /^\[?(:?::1?|::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|fe80:|fc00:|fd00:)/i.test(hostname);
    
    // Block IPv4 private ranges, localhost, and common local network bypasses
    const isIPv4Internal = /^(localhost|0\.0\.0\.0|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(hostname);
    
    // Block cloud metadata hostnames
    const blockedHosts = [
      'metadata.google.internal', 
      'metadata.goog', 
      'instance-data.ec2.internal', 
      'metadata.tencent.com', 
      '169.254.169.254',
      'metadata'
    ];
    const isMetadataHost = blockedHosts.includes(hostname);
    
    // Block non-standard numeric IPs (Decimal, Hex, Octal with dots)
    const isNumericIP = /^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname) || /^(0\d+(\.|$))/.test(hostname);

    if (isIPv6Internal || isIPv4Internal || isNumericIP || isMetadataHost) {
      console.warn(`[${context}] SSRF Blocked (Static Check): ${hostname}`);
      throw new Error('Restricted URL origin');
    }

    // 2. DNS Resolution Check (Mitigates DNS Rebinding)
    // This checks what the hostname resolves to just before we perform the fetch.
    let resolvedAddress = '';
    try {
      const addresses = await lookup(hostname, { all: true });
      
      for (const { address } of addresses) {
        const isIpIPv6Internal = /^(:?::1?|::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|fe80:|fc00:|fd00:)/i.test(address);
        const isIpIPv4Internal = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.)/.test(address);
        
        if (isIpIPv6Internal || isIpIPv4Internal) {
          console.warn(`[${context}] DNS Rebinding Blocked: ${hostname} resolved to ${address}`);
          throw new Error('Restricted URL resolved to internal IP');
        }
      }
      
      // Pin to the first safe address we found
      resolvedAddress = addresses[0]?.address || hostname;
    } catch (dnsErr: any) {
      // Re-throw our own SSRF errors; only catch actual DNS failures
      if (dnsErr.message === 'Restricted URL resolved to internal IP') {
        throw dnsErr;
      }
      // If resolution fails entirely, block to be safe (prevent potential probe-response attacks)
      console.warn(`[${context}] Host resolution failed for ${hostname}:`, dnsErr.message);
      throw new Error('Host resolution failed');
    }

    return { hostname, address: resolvedAddress };
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes('Invalid URL')) {
      throw new Error('Invalid URL format');
    }
    throw err;
  }
}
