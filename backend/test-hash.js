import bcrypt from 'bcryptjs';

const password = 'admin123';

// Generate hash
const hash = await bcrypt.hash(password, 10);
console.log('Generated hash for "admin123":');
console.log(hash);

// Test comparison
const isValid = await bcrypt.compare(password, hash);
console.log('\nPassword comparison test:', isValid ? '✅ PASS' : '❌ FAIL');

// Test with the hash from SQL
const sqlHash = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDlzIZWjpxw5TZjxJB7cQjXvJm6a';
const isValidSql = await bcrypt.compare(password, sqlHash);
console.log('SQL hash comparison test:', isValidSql ? '✅ PASS' : '❌ FAIL');
