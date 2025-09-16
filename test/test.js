const {test, describe} = require("node:test");
const assert = require("node:assert");


describe("Test", () => {
    test("hello bro", ()=>{
        const expected = "Hello World!";
        const actual = 'Hello World!';

        assert.strictEqual(actual, expected);
    });
});