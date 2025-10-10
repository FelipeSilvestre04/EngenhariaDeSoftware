import { CalendarService } from "../services/CalendarService";

export class CalendarController {
    constructor(cofig){
        this.service = CalendarService(config);
    }
}