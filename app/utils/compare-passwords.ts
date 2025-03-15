import { promisify } from "util";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";

const scryptAsync = promisify(scrypt);

export async function comparePasswords(supplied: string, stored: string) {
    try {
      const [hashedPart, salt] = stored.split(".");
      if (!hashedPart || !salt) {
        console.error("Invalid stored password format");
        return false;
      }
  
      // Determine hash length and use appropriate scrypt length
      const hashLength = hashedPart.length;
      const keyLength = hashLength === 64 ? 32 : 64; // 64 chars = 32 bytes, 128 chars = 64 bytes
  
      console.log("Hash comparison:", {
        hashLength,
        keyLength,
        storedHashLength: hashedPart.length,
      });
  
      const hashedBuf = Buffer.from(hashedPart, "hex");
      const suppliedBuf = (await scryptAsync(
        supplied,
        salt,
        keyLength,
      )) as Buffer;
  
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error("Password comparison error:", error);
      return false;
    }
  }