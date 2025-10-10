import { google } from 'googleapis';
import { TokenStorage } from '../storage/TokenStorage';

export class CalendarModel {
    constructor(config){
        // criar storage?
        this.tokenStorage = new TokenStorage();
        this.oauth2Client = new google.auth.Oauth2(
            config.googleCalendar.clientId,
            config.googleCalendar.clientSecret,
            config.googleCalendar.redirectUri
        );
        this.calendar = null;
        this.config = config;
    }

    getAuthUrl(){
        return this.oauth2Client.generateAuthUrl({
            acess_type: 'offline',
            scope: this.config.googleCalendar.scopes,
            prompt: 'consent',
        });
    }

    async isAutheticated(){
        return await this.tokenStorage.hasTokens();
    }
}