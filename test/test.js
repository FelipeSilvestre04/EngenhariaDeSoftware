import {test, describe} from "node:test";
import assert from "node:assert";


describe("Test", () => {
    test("hello bro", ()=>{
        const expected = "Hello World!";
        const actual = 'Hello World!';

        assert.strictEqual(actual, expected);
    });
});