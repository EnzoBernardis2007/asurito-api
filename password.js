import crypto from 'crypto';

function hashPasswordWithSalt(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return { salt, hash };
}

function comparePassword(password, salt, storedHash) {
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return hash === storedHash;
}

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto.createHash("sha256")
  .update(String(process.env.CPF_SECRET))
  .digest("base64")
  .substr(0, 32);
const IV_LENGTH = 16;

export function encryptCPF(cpf) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(cpf, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptCPF(encryptedCpf) {
  const [ivHex, encrypted] = encryptedCpf.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// 👇 exporta funções para usar em outros arquivos
export { hashPasswordWithSalt, comparePassword };