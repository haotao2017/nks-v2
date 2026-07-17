package no.nks.util;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 旧密码加密工具（DES/CBC/PKCS5Padding + UTF-16LE + Base64）。
 * 仅用于登录时校验并平滑迁移旧密文到 BCrypt，请勿用于新密码存储。
 */
public class DesEncryptionUtil {

    private static final byte[] KEY_BYTES = new byte[]{1, 23, 13, 44, 5, 6, 7, 8};
    private static final byte[] IV_BYTES = new byte[]{1, 23, 13, 44, 5, 6, 7, 8};

    private static final String ALGORITHM = "DES";
    private static final String TRANSFORMATION = "DES/CBC/PKCS5Padding";

    public static String encrypt(String text) {
        if (text == null) {
            return null;
        }
        try {
            SecretKey secretKey = new SecretKeySpec(KEY_BYTES, ALGORITHM);
            IvParameterSpec ivParameterSpec = new IvParameterSpec(IV_BYTES);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivParameterSpec);

            // C# Encoding.Unicode is UTF-16LE
            byte[] inputBuffer = text.getBytes(StandardCharsets.UTF_16LE);
            byte[] outputBuffer = cipher.doFinal(inputBuffer);
            return Base64.getEncoder().encodeToString(outputBuffer);
        } catch (Exception e) {
            throw new RuntimeException("Error during DES encryption", e);
        }
    }

    public static String decrypt(String base64CipherText) {
        if (base64CipherText == null) {
            return null;
        }
        try {
            SecretKey secretKey = new SecretKeySpec(KEY_BYTES, ALGORITHM);
            IvParameterSpec ivParameterSpec = new IvParameterSpec(IV_BYTES);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivParameterSpec);

            byte[] inputBuffer = Base64.getDecoder().decode(base64CipherText);
            byte[] outputBuffer = cipher.doFinal(inputBuffer);
            return new String(outputBuffer, StandardCharsets.UTF_16LE);
        } catch (Exception e) {
            throw new RuntimeException("Error during DES decryption", e);
        }
    }
}
