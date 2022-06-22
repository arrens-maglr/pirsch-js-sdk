import {
    PirschClientConfig,
    PirschAuthenticationResponse,
    PirschApiError,
    PirschHit,
    PirschDomain,
    PirschFilter,
    PirschKeyword,
    PirschScreenClassStats,
    PirschPlatformStats,
    PirschCountryStats,
    PirschBrowserStats,
    PirschOSStats,
    PirschReferrerStats,
    PirschLanguageStats,
    PirschVisitorHourStats,
    PirschActiveVisitorsData,
    PirschGrowth,
    PirschConversionGoal,
    PirschEventStats,
    PirschPageStats,
    PirschVisitorStats,
    PirschUTMTermStats,
    PirschUTMContentStats,
    PirschUTMCampaignStats,
    PirschUTMMediumStats,
    PirschUTMSourceStats,
    PirschTimeSpentStats,
    PirschTotalVisitorStats,
    PirschEventListStats,
    PirschOSVersionStats,
    PirschBrowserVersionStats,
    PirschEntryStats,
    PirschExitStats,
    PirschCityStats,
    PirschHttpOptions,
    Scalar,
    Optional,
} from "./types";

import {
    PIRSCH_DEFAULT_BASE_URL,
    PIRSCH_DEFAULT_TIMEOUT,
    PIRSCH_DEFAULT_PROTOCOL,
    PIRSCH_AUTHENTICATION_ENDPOINT,
    PIRSCH_HIT_ENDPOINT,
    PIRSCH_EVENT_ENDPOINT,
    PIRSCH_SESSION_ENDPOINT,
    PIRSCH_DOMAIN_ENDPOINT,
    PIRSCH_SESSION_DURATION_ENDPOINT,
    PIRSCH_TIME_ON_PAGE_ENDPOINT,
    PIRSCH_UTM_SOURCE_ENDPOINT,
    PIRSCH_UTM_MEDIUM_ENDPOINT,
    PIRSCH_UTM_CAMPAIGN_ENDPOINT,
    PIRSCH_UTM_CONTENT_ENDPOINT,
    PIRSCH_UTM_TERM_ENDPOINT,
    PIRSCH_TOTAL_VISITORS_ENDPOINT,
    PIRSCH_VISITORS_ENDPOINT,
    PIRSCH_PAGES_ENDPOINT,
    PIRSCH_ENTRY_PAGES_ENDPOINT,
    PIRSCH_EXIT_PAGES_ENDPOINT,
    PIRSCH_CONVERSION_GOALS_ENDPOINT,
    PIRSCH_EVENTS_ENDPOINT,
    PIRSCH_EVENT_METADATA_ENDPOINT,
    PIRSCH_LIST_EVENTS_ENDPOINT,
    PIRSCH_GROWTH_RATE_ENDPOINT,
    PIRSCH_ACTIVE_VISITORS_ENDPOINT,
    PIRSCH_TIME_OF_DAY_ENDPOINT,
    PIRSCH_LANGUAGE_ENDPOINT,
    PIRSCH_REFERRER_ENDPOINT,
    PIRSCH_OS_ENDPOINT,
    PIRSCH_OS_VERSION_ENDPOINT,
    PIRSCH_BROWSER_ENDPOINT,
    PIRSCH_BROWSER_VERSION_ENDPOINT,
    PIRSCH_COUNTRY_ENDPOINT,
    PIRSCH_CITY_ENDPOINT,
    PIRSCH_PLATFORM_ENDPOINT,
    PIRSCH_SCREEN_ENDPOINT,
    PIRSCH_KEYWORDS_ENDPOINT,
} from "./constants";

export abstract class Core {
    protected readonly clientId: string;
    protected readonly clientSecret: string;
    protected readonly hostname: string;
    protected readonly protocol: string;
    protected readonly baseUrl: string;
    protected readonly timeout: number;
    protected accessToken = "";

    /**
     * The constructor creates a new client.
     *
     * @param config You need to pass in the hostname, client ID, and client secret you have configured on the Pirsch dashboard.
     * It's also recommended to set the proper protocol for your website, else it will be set to http by default.
     * All other configuration parameters can be left to their defaults.
     */
    constructor({
        baseUrl = PIRSCH_DEFAULT_BASE_URL,
        timeout = PIRSCH_DEFAULT_TIMEOUT,
        protocol = PIRSCH_DEFAULT_PROTOCOL,
        hostname,
        clientId,
        clientSecret,
    }: PirschClientConfig) {
        if (!clientId) {
            this.accessToken = clientSecret;
        }

        this.baseUrl = baseUrl;
        this.timeout = timeout;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.hostname = hostname;
        this.protocol = protocol;
    }

    /**
     * hit sends a hit to Pirsch. Make sure you call it in all request handlers you want to track.
     * Also, make sure to filter out unwanted pathnames (like /favicon.ico in your root handler for example).
     *
     * @param hit all required data for the request.
     * @returns APIError or an empty promise, in case something went wrong
     */
    async hit(hit: PirschHit): Promise<Optional<PirschApiError>> {
        if (hit.dnt === "1") {
            return;
        }

        return await this.performPost(PIRSCH_HIT_ENDPOINT, hit);
    }

    /**
     * event sends an event to Pirsch. Make sure you call it in all request handlers you want to track.
     * Also, make sure to filter out unwanted pathnames (like /favicon.ico in your root handler for example).
     *
     * @param name the name for the event
     * @param hit all required data for the request
     * @param duration optional duration for the event
     * @param meta optional object containing metadata (only scalar values, like strings, numbers, and booleans)
     * @returns APIError or an empty promise, in case something went wrong
     */
    async event(name: string, hit: PirschHit, duration = 0, meta?: Record<string, Scalar>): Promise<Optional<PirschApiError>> {
        if (hit.dnt === "1") {
            return;
        }

        return await this.performPost(PIRSCH_EVENT_ENDPOINT, {
            event_name: name,
            event_duration: duration,
            event_meta: meta,
            ...hit,
        });
    }

    /**
     * session keeps a session alive.
     *
     * @param hit all required data for the request.
     * @returns APIError or an empty promise, in case something went wrong
     */
    async session(hit: PirschHit): Promise<Optional<PirschApiError>> {
        if (hit.dnt === "1") {
            return;
        }

        return await this.performPost(PIRSCH_SESSION_ENDPOINT, hit);
    }

    /**
     * domain returns the domain for this client.
     *
     * @returns Domain object for this client.
     */
    async domain(): Promise<PirschDomain | PirschApiError> {
        const result = await this.performGet<PirschDomain[]>(PIRSCH_DOMAIN_ENDPOINT);

        const error: PirschApiError = {
            code: 404,
            validation: {},
            error: ["domain not found"],
        };

        if (Array.isArray(result) && result.length === 0) {
            return error;
        } else if (Array.isArray(result)) {
            return result.at(0) ?? error;
        }

        return result;
    }

    /**
     * sessionDuration returns the session duration grouped by day.
     *
     * @param filter used to filter the result set.
     */
    async sessionDuration(filter: PirschFilter): Promise<PirschTimeSpentStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschTimeSpentStats[]>(PIRSCH_SESSION_DURATION_ENDPOINT, filter);
    }

    /**
     * timeOnPage returns the time spent on pages.
     *
     * @param filter used to filter the result set.
     */
    async timeOnPage(filter: PirschFilter): Promise<PirschTimeSpentStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschTimeSpentStats[]>(PIRSCH_TIME_ON_PAGE_ENDPOINT, filter);
    }

    /**
     * utmSource returns the utm sources.
     *
     * @param filter used to filter the result set.
     */
    async utmSource(filter: PirschFilter): Promise<PirschUTMSourceStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschUTMSourceStats[]>(PIRSCH_UTM_SOURCE_ENDPOINT, filter);
    }

    /**
     * utmMedium returns the utm medium.
     *
     * @param filter used to filter the result set.
     */
    async utmMedium(filter: PirschFilter): Promise<PirschUTMMediumStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschUTMMediumStats[]>(PIRSCH_UTM_MEDIUM_ENDPOINT, filter);
    }

    /**
     * utmCampaign returns the utm campaigns.
     *
     * @param filter used to filter the result set.
     */
    async utmCampaign(filter: PirschFilter): Promise<PirschUTMCampaignStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschUTMCampaignStats[]>(PIRSCH_UTM_CAMPAIGN_ENDPOINT, filter);
    }

    /**
     * utmContent returns the utm content.
     *
     * @param filter used to filter the result set.
     */
    async utmContent(filter: PirschFilter): Promise<PirschUTMContentStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschUTMContentStats[]>(PIRSCH_UTM_CONTENT_ENDPOINT, filter);
    }

    /**
     * utmTerm returns the utm term.
     *
     * @param filter used to filter the result set.
     */
    async utmTerm(filter: PirschFilter): Promise<PirschUTMTermStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschUTMTermStats[]>(PIRSCH_UTM_TERM_ENDPOINT, filter);
    }

    /**
     * totalVisitors returns the total visitor statistics.
     *
     * @param filter used to filter the result set.
     */
    async totalVisitors(filter: PirschFilter): Promise<PirschTotalVisitorStats | PirschApiError> {
        return await this.performFilteredGet<PirschTotalVisitorStats>(PIRSCH_TOTAL_VISITORS_ENDPOINT, filter);
    }

    /**
     * visitors returns the visitor statistics grouped by day.
     *
     * @param filter used to filter the result set.
     */
    async visitors(filter: PirschFilter): Promise<PirschVisitorStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschVisitorStats[]>(PIRSCH_VISITORS_ENDPOINT, filter);
    }

    /**
     * entryPages returns the entry page statistics grouped by page.
     *
     * @param filter used to filter the result set.
     */
    async entryPages(filter: PirschFilter): Promise<PirschEntryStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschEntryStats[]>(PIRSCH_ENTRY_PAGES_ENDPOINT, filter);
    }

    /**
     * exitPages returns the exit page statistics grouped by page.
     *
     * @param filter used to filter the result set.
     */
    async exitPages(filter: PirschFilter): Promise<PirschExitStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschExitStats[]>(PIRSCH_EXIT_PAGES_ENDPOINT, filter);
    }

    /**
     * pages returns the page statistics grouped by page.
     *
     * @param filter used to filter the result set.
     */
    async pages(filter: PirschFilter): Promise<PirschPageStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschPageStats[]>(PIRSCH_PAGES_ENDPOINT, filter);
    }

    /**
     * conversionGoals returns all conversion goals.
     *
     * @param filter used to filter the result set.
     */
    async conversionGoals(filter: PirschFilter): Promise<PirschConversionGoal[] | PirschApiError> {
        return await this.performFilteredGet<PirschConversionGoal[]>(PIRSCH_CONVERSION_GOALS_ENDPOINT, filter);
    }

    /**
     * events returns all events.
     *
     * @param filter used to filter the result set.
     */
    async events(filter: PirschFilter): Promise<PirschEventStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschEventStats[]>(PIRSCH_EVENTS_ENDPOINT, filter);
    }

    /**
     * eventMetadata returns the metadata for a single event.
     *
     * @param filter used to filter the result set.
     */
    async eventMetadata(filter: PirschFilter): Promise<PirschEventStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschEventStats[]>(PIRSCH_EVENT_METADATA_ENDPOINT, filter);
    }

    /**
     * listEvents returns a list of all events including metadata.
     *
     * @param filter used to filter the result set.
     */
    async listEvents(filter: PirschFilter): Promise<PirschEventListStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschEventListStats[]>(PIRSCH_LIST_EVENTS_ENDPOINT, filter);
    }

    /**
     * growth returns the growth rates for visitors, bounces, ...
     *
     * @param filter used to filter the result set.
     */
    async growth(filter: PirschFilter): Promise<PirschGrowth | PirschApiError> {
        return await this.performFilteredGet<PirschGrowth>(PIRSCH_GROWTH_RATE_ENDPOINT, filter);
    }

    /**
     * activeVisitors returns the active visitors and what pages they're on.
     *
     * @param filter used to filter the result set.
     */
    async activeVisitors(filter: PirschFilter): Promise<PirschActiveVisitorsData | PirschApiError> {
        return await this.performFilteredGet<PirschActiveVisitorsData>(PIRSCH_ACTIVE_VISITORS_ENDPOINT, filter);
    }

    /**
     * timeOfDay returns the number of unique visitors grouped by time of day.
     *
     * @param filter used to filter the result set.
     */
    async timeOfDay(filter: PirschFilter): Promise<PirschVisitorHourStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschVisitorHourStats[]>(PIRSCH_TIME_OF_DAY_ENDPOINT, filter);
    }

    /**
     * languages returns language statistics.
     *
     * @param filter used to filter the result set.
     */
    async languages(filter: PirschFilter): Promise<PirschLanguageStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschLanguageStats[]>(PIRSCH_LANGUAGE_ENDPOINT, filter);
    }

    /**
     * referrer returns referrer statistics.
     *
     * @param filter used to filter the result set.
     */
    async referrer(filter: PirschFilter): Promise<PirschReferrerStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschReferrerStats[]>(PIRSCH_REFERRER_ENDPOINT, filter);
    }

    /**
     * os returns operating system statistics.
     *
     * @param filter used to filter the result set.
     */
    async os(filter: PirschFilter): Promise<PirschOSStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschOSStats[]>(PIRSCH_OS_ENDPOINT, filter);
    }

    /**
     * osVersions returns operating system version statistics.
     *
     * @param filter used to filter the result set.
     */
    async osVersions(filter: PirschFilter): Promise<PirschOSVersionStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschOSVersionStats[]>(PIRSCH_OS_VERSION_ENDPOINT, filter);
    }

    /**
     * browser returns browser statistics.
     *
     * @param filter used to filter the result set.
     */
    async browser(filter: PirschFilter): Promise<PirschBrowserStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschBrowserStats[]>(PIRSCH_BROWSER_ENDPOINT, filter);
    }

    /**
     * browserVersions returns browser version statistics.
     *
     * @param filter used to filter the result set.
     */
    async browserVersions(filter: PirschFilter): Promise<PirschBrowserVersionStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschBrowserVersionStats[]>(PIRSCH_BROWSER_VERSION_ENDPOINT, filter);
    }

    /**
     * country returns country statistics.
     *
     * @param filter used to filter the result set.
     */
    async country(filter: PirschFilter): Promise<PirschCountryStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschCountryStats[]>(PIRSCH_COUNTRY_ENDPOINT, filter);
    }

    /**
     * city returns city statistics.
     *
     * @param filter used to filter the result set.
     */
    async city(filter: PirschFilter): Promise<PirschCityStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschCityStats[]>(PIRSCH_CITY_ENDPOINT, filter);
    }

    /**
     * platform returns the platforms used by visitors.
     *
     * @param filter used to filter the result set.
     */
    async platform(filter: PirschFilter): Promise<PirschPlatformStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschPlatformStats[]>(PIRSCH_PLATFORM_ENDPOINT, filter);
    }

    /**
     * screen returns the screen classes used by visitors.
     *
     * @param filter used to filter the result set.
     */
    async screen(filter: PirschFilter): Promise<PirschScreenClassStats[] | PirschApiError> {
        return await this.performFilteredGet<PirschScreenClassStats[]>(PIRSCH_SCREEN_ENDPOINT, filter);
    }

    /**
     * keywords returns the Google keywords, rank, and CTR.
     *
     * @param filter used to filter the result set.
     */
    async keywords(filter: PirschFilter): Promise<PirschKeyword[] | PirschApiError> {
        return await this.performFilteredGet<PirschKeyword[]>(PIRSCH_KEYWORDS_ENDPOINT, filter);
    }

    private async performPost<T extends object>(url: string, data: T, retry = true): Promise<Optional<PirschApiError>> {
        try {
            await this.post(
                url,
                {
                    hostname: this.hostname,
                    ...data,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }
            );
            return;
        } catch (error: unknown) {
            const exception = await this.toApiError(error);

            if (exception && this.clientId && exception.code === 401 && retry) {
                await this.refreshToken();
                return this.performPost(url, data, false);
            }

            throw error;
        }
    }

    private async performGet<T>(url: string, parameters: object = {}, retry = true): Promise<T | PirschApiError> {
        try {
            if (!this.accessToken && retry) {
                await this.refreshToken();
            }

            const data = await this.get<T>(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.accessToken}`,
                },
                parameters,
            });
            return data;
        } catch (error: unknown) {
            const exception = await this.toApiError(error);

            if (exception && this.clientId && exception.code === 401 && retry) {
                await this.refreshToken();
                return this.performGet<T>(url, parameters, false);
            }

            throw error;
        }
    }

    private async performFilteredGet<T>(url: string, filter: PirschFilter): Promise<T | PirschApiError> {
        return this.performGet<T>(url, filter);
    }

    private async refreshToken(): Promise<Optional<PirschApiError>> {
        try {
            const result = await this.post<PirschAuthenticationResponse>(PIRSCH_AUTHENTICATION_ENDPOINT, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
            });
            this.accessToken = result.access_token;
            return;
        } catch (error: unknown) {
            this.accessToken = "";

            const exception = await this.toApiError(error);

            if (exception) {
                return exception;
            }

            throw error;
        }
    }

    protected abstract post<Response, Data extends object = object>(
        url: string,
        data: Data,
        options?: PirschHttpOptions
    ): Promise<Response>;
    protected abstract get<Response>(url: string, options?: PirschHttpOptions): Promise<Response>;
    protected abstract toApiError(error: unknown): Promise<Optional<PirschApiError>>;
}
