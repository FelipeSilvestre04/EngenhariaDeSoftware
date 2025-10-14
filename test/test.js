import {test, describe} from "node:test";
import assert from "node:assert";
import { CalendarModel } from "../src/modules/calendar/models/CalendarModel.js";
import { CalendarService } from "../src/modules/calendar/services/CalendarService.js";
import { config } from "../src/shared/config/index.js";
import { calendar } from "googleapis/build/src/apis/calendar/index.js";

describe("Test", () => {
    test("hello bro", ()=>{
        const expected = "Hello World!";
        const actual = 'Hello World!';

        assert.strictEqual(actual, expected);
    });
});

// describe("Test calendar model funcs", () => {
//     const calendarModel = new CalendarModel( config );

//     test("create", () => {
//         assert(calendarModel != null && calendarModel != undefined);
//     })

//     test("get auth url", () => {
//         const url =  calendarModel.getAuthUrl();
//         console.log(url);
//         assert(url != null);
//     })

//     test("delete tokens", () => {
//         calendarModel.logout();
//         assert(true);
//     })
// })

// describe("Test calendar service funcs", () => {
//     const calendarService = new CalendarService(config);

//     test("list events", () => {
//         calendarService.listEvents(10);
//     })
// })