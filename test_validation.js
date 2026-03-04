// Test script for validation function
const fs = require('fs');
const path = require('path');

// Read and evaluate the utils file to extract hasAmount function
const utilsPath = path.join(__dirname, 'src/utils/index.ts');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');

// Extract the hasAmount function and convert to JavaScript
const hasAmountMatch = utilsContent.match(/export function hasAmount\(text: string\): boolean {[\s\S]*?^}/m);
if (!hasAmountMatch) {
    console.log('Could not find hasAmount function');
    process.exit(1);
}

// Convert TypeScript to JavaScript
const jsFunction = hasAmountMatch[0]
    .replace('export function hasAmount(text: string): boolean', 'function hasAmount(text)')
    .replace(/: string/g, '')
    .replace(/: boolean/g, '');

eval(jsFunction);

// Test cases
const testCases = [
    // Should return true (contains amounts)
    { text: "จ่ายค่าอาหาร 200", expected: true },
    { text: "ซื้อของ 150 บาท", expected: true },
    { text: "เมื่อวานจ่ายค่าเน็ต 600", expected: true },
    { text: "ซื้อไก่ 20 บาท เมื่อวันศุกร์ที่ผ่านมา", expected: true },
    { text: "income 1000 from salary", expected: true },
    { text: "spent $50 on lunch", expected: true },
    { text: "ค่าใช้จ่าย 1,500 บาท", expected: true },
    { text: "ราคา 2,500.50 บาท", expected: true },
    { text: "จ่าย 1 000 บาท", expected: true },
    
    // Should return false (no amounts)
    { text: "test", expected: false },
    { text: "hello world", expected: false },
    { text: "วันนี้ฉันไปกินข้าว", expected: false },
    { text: "just a message", expected: false },
    { text: "no numbers here", expected: false },
    
    // Edge cases (should return false - years/phone numbers)
    { text: "ปี 2024", expected: false },
    { text: "call me at 0812345678", expected: false },
    { text: "in 1999 I was born", expected: false },
    
    // Edge cases (should return true - valid amounts)
    { text: "price is 99.99", expected: true },
    { text: "cost 0.50 baht", expected: true },
    { text: "amount 1000฿", expected: true },
];

console.log("Testing hasAmount function...\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = hasAmount(testCase.text);
    const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL";
    
    console.log(`${status} Test ${index + 1}: "${testCase.text}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    
    if (result === testCase.expected) {
        passed++;
    } else {
        failed++;
    }
    console.log("");
});

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
