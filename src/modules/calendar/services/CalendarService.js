import { CalendarModel } from "../models/CalendarModel";

export class CalendarService {
    constructor(config){
        this.model = CalendarModel(config);
    }
}