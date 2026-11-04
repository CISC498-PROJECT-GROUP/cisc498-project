// The one request rewrite the extension makes: Origin and Referer on ITS OWN requests to Stellic.
//
// Stellic is a Django app. Its POST endpoints check the CSRF token (X-CSRFToken, which we copy from
// the csrftoken cookie) AND that Origin/Referer name Stellic itself — a request from a
// chrome-extension:// page fails the second check with a 403 even with a valid token. A fetch
// cannot set those headers, so a declarativeNetRequest rule sets them to the values Stellic's own
// page sends.
//
// The rule is scoped by `initiatorDomains` to this extension's id: it never touches a request a
// website makes to Stellic, so it does not weaken Stellic's CSRF protection for anyone else. It is
// a dynamic rule (it persists across restarts), installed idempotently by the background worker and
// again by the dashboard before its first call.

import { STELLIC_ORIGIN } from '@/services/school';

const RULE_ID = 1;

export async function installStellicRule(): Promise<void> {
    const rule: chrome.declarativeNetRequest.Rule = {
        id: RULE_ID,
        priority: 1,
        action: {
            type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
            requestHeaders: [
                { header: 'origin', operation: 'set' as chrome.declarativeNetRequest.HeaderOperation, value: STELLIC_ORIGIN },
                { header: 'referer', operation: 'set' as chrome.declarativeNetRequest.HeaderOperation, value: `${STELLIC_ORIGIN}/app/planner` },
            ],
        },
        condition: {
            urlFilter: `|${STELLIC_ORIGIN}/`,
            initiatorDomains: [chrome.runtime.id],
            resourceTypes: ['xmlhttprequest' as chrome.declarativeNetRequest.ResourceType],
        },
    };
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [RULE_ID], addRules: [rule] });
}
