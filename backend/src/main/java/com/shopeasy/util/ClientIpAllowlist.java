package com.shopeasy.util;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;

/**
 * 로그인 IP 허용 목록(단일 IPv4 또는 CIDR). IPv4만 처리.
 */
public final class ClientIpAllowlist {

    private ClientIpAllowlist() {}

    /**
     * @param clientIp 클라이언트에서 판별한 IP 문자열
     * @param rules      단일 IP 또는 a.b.c.d/nn 형태 CIDR 목록
     * @return 규칙이 비어 있으면 false
     */
    public static boolean isAllowed(String clientIp, List<String> rules) {
        if (rules == null || rules.isEmpty()) {
            return false;
        }
        byte[] client = toIpv4Bytes(clientIp);
        if (client == null) {
            return false;
        }
        int clientInt = bytesToInt(client);
        for (String raw : rules) {
            if (raw == null) {
                continue;
            }
            String rule = raw.trim();
            if (rule.isEmpty()) {
                continue;
            }
            if (rule.contains("/")) {
                if (matchCidr(clientInt, rule)) {
                    return true;
                }
            } else {
                byte[] single = toIpv4Bytes(rule);
                if (single != null && Arrays.equals(client, single)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static byte[] toIpv4Bytes(String host) {
        if (host == null || host.isBlank()) {
            return null;
        }
        try {
            InetAddress a = InetAddress.getByName(host.trim());
            if (!(a instanceof Inet4Address)) {
                return null;
            }
            return a.getAddress();
        } catch (UnknownHostException e) {
            return null;
        }
    }

    private static int bytesToInt(byte[] b) {
        return ((b[0] & 0xff) << 24) | ((b[1] & 0xff) << 16) | ((b[2] & 0xff) << 8) | (b[3] & 0xff);
    }

    private static boolean matchCidr(int ipInt, String cidr) {
        String[] p = cidr.split("/");
        if (p.length != 2) {
            return false;
        }
        byte[] net = toIpv4Bytes(p[0].trim());
        if (net == null) {
            return false;
        }
        int prefix;
        try {
            prefix = Integer.parseInt(p[1].trim());
        } catch (NumberFormatException e) {
            return false;
        }
        if (prefix < 0 || prefix > 32) {
            return false;
        }
        int netInt = bytesToInt(net);
        if (prefix == 0) {
            return true;
        }
        long mask = (-1L << (32 - prefix)) & 0xffffffffL;
        long ipL = ipInt & 0xffffffffL;
        long netL = netInt & 0xffffffffL;
        return (ipL & mask) == (netL & mask);
    }
}
