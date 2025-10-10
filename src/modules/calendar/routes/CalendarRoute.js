import { CalendarController } from "../controllers/CalendarController";

export class CalendarRoute {
    constructor (config){
        this.controller = CalendarController(config);
    }
}