/**
 * n8nService.js
 *
 * Bridge service to communicate with the external n8n AI Retention Agent Webhook.
 *
 * Responsibilities:
 *  1. Dispatches meeting proposal requests to the external n8n Webhook URL.
 *  2. Supports both natural language ('message') and structured JSON contract for n8n AI Agent nodes.
 *  3. Passes secure authentication headers (N8N_AGENT_SECRET, N8N_HEADER_NAME).
 *  4. Handles Windows TLS certificate verification gracefully (matching emailService.js).
 *  5. Handles timeouts (default 10s), network errors, 403s, and non-200 responses safely.
 *  6. Validates returned AI output on the backend (treats AI output as untrusted proposal).
 *  7. Provides a deterministic internal fallback proposal generator when n8n is offline, unconfigured, or returns an error.
 */

import https from "https";
import http from "http";
import { URL } from "url";

// Configurable environment variables
const N8N_RETENTION_WEBHOOK_URL =
  process.env.N8N_RETENTION_WEBHOOK_URL?.trim() ||
  "https://retainpulse1.app.n8n.cloud/webhook/retention-meeting";

const N8N_AGENT_SECRET = process.env.N8N_AGENT_SECRET?.trim() || "";
const N8N_HEADER_NAME = process.env.N8N_HEADER_NAME?.trim() || "x-n8n-agent-secret";
const N8N_TIMEOUT_MS = Number(process.env.N8N_TIMEOUT_MS) || 12000;

/**
 * Checks if the n8n webhook URL is configured.
 */
export function isN8nConfigured() {
  return Boolean(N8N_RETENTION_WEBHOOK_URL && N8N_RETENTION_WEBHOOK_URL.startsWith("http"));
}

/**
 * Sanitizes and validates date string (YYYY-MM-DD).
 */
function isValidDateStr(str) {
  if (!str || typeof str !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(str.trim());
}

/**
 * Sanitizes and validates time string (HH:MM).
 */
function isValidTimeStr(str) {
  if (!str || typeof str !== "string") return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(str.trim());
}

/**
 * Makes an HTTP/HTTPS POST request with rejectUnauthorized: false and timeout.
 */
function postJson(urlStr, data, headers = {}, timeoutMs = N8N_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(urlStr);
    } catch (e) {
      return reject(new Error(`Invalid Webhook URL: ${urlStr}`));
    }

    const payload = JSON.stringify(data);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const requestHeaders = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "User-Agent": "RetainPulse-Backend/1.0",
      ...headers,
    };

    const req = transport.request(
      urlStr,
      {
        method: "POST",
        headers: requestHeaders,
        rejectUnauthorized: false, // Prevents Windows/corporate intermediate TLS certificate verify failures
        timeout: timeoutMs,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`n8n request timed out after ${timeoutMs}ms`));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Calls the external n8n Retention Agent Webhook to request a retention meeting proposal.
 *
 * @param {object} payload
 * @param {string} payload.employeeId      - Verified database employee ID
 * @param {string} payload.employeeName    - Employee full name
 * @param {string} payload.employeeCode    - Employee company code
 * @param {string} payload.riskLevel       - "HIGH_RISK" | "NEEDS_ATTENTION" | "MEDIUM"
 * @param {number} payload.mlProbability   - ML departure probability (0 - 1)
 * @param {Array<string>} payload.riskFactors - Specific identified risk triggers
 * @param {string} payload.purpose         - HR meeting purpose
 * @param {string} payload.notes           - HR notes or context
 * @param {string} payload.preferredDate   - Optional HR preferred date (YYYY-MM-DD)
 * @param {string} payload.preferredTime   - Optional HR preferred time (HH:MM)
 * @param {string} payload.hrName          - Requesting HR user name
 * @param {string} payload.hrEmail         - Requesting HR user email
 *
 * @returns {Promise<{ success: boolean, proposal?: object, isFallback?: boolean, reason?: string, raw?: any }>}
 */
export async function callN8nRetentionAgent(payload) {
  if (!isN8nConfigured()) {
    return {
      success: false,
      isFallback: true,
      reason: "N8N_RETENTION_WEBHOOK_URL is not configured in backend environment variables.",
    };
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const empName = payload.employeeName || "Employee";
  const factorsStr = Array.isArray(payload.riskFactors) && payload.riskFactors.length > 0
    ? payload.riskFactors.join(", ")
    : "workplace sentiment and retention discussion";

  // Build dual-format payload:
  // 1. 'message' field for conversational / LLM agent nodes in n8n
  // 2. Structured JSON object for structured nodes
  const naturalLanguagePrompt =
    `Please schedule a retention meeting for high-risk employee ${empName} (${payload.employeeCode || "N/A"}). ` +
    `Risk level: ${payload.riskLevel || "HIGH_RISK"}${payload.mlProbability ? ` (Probability: ${(payload.mlProbability * 100).toFixed(1)}%)` : ""}. ` +
    `Key factors: ${factorsStr}. ` +
    `Meeting purpose: ${payload.purpose || "Employee retention discussion"}. ` +
    (payload.preferredDate ? `Preferred date: ${payload.preferredDate}. ` : "") +
    (payload.preferredTime ? `Preferred time: ${payload.preferredTime}. ` : "") +
    (payload.notes ? `HR Notes: ${payload.notes}. ` : "") +
    `Propose a meeting date, time, agenda, and draft invitation.`;

  const requestBody = {
    message: naturalLanguagePrompt,
    action: "propose_retention_meeting",
    requestId,
    timestamp: new Date().toISOString(),
    employee: {
      employeeId: String(payload.employeeId),
      name: empName,
      employeeCode: payload.employeeCode || "N/A",
      riskLevel: payload.riskLevel || "HIGH_RISK",
      mlProbability: payload.mlProbability != null ? Number(payload.mlProbability) : null,
      riskFactors: Array.isArray(payload.riskFactors) ? payload.riskFactors : [],
    },
    meeting: {
      purpose: payload.purpose || "Confidential Retention & Feedback Discussion",
      notes: payload.notes || "",
      preferredDate: payload.preferredDate || null,
      preferredTime: payload.preferredTime || null,
    },
    hr: {
      name: payload.hrName || "HR Representative",
      email: payload.hrEmail || "",
    },
  };

  const headers = {};
  if (N8N_AGENT_SECRET) {
    headers[N8N_HEADER_NAME] = N8N_AGENT_SECRET;
    headers["Authorization"] = `Bearer ${N8N_AGENT_SECRET}`;
  }

  try {
    console.log(`[n8nService] Contacting n8n webhook at: ${N8N_RETENTION_WEBHOOK_URL}`);

    const res = await postJson(N8N_RETENTION_WEBHOOK_URL, requestBody, headers, N8N_TIMEOUT_MS);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      let errorReason = `n8n webhook returned HTTP ${res.statusCode}`;
      if (res.statusCode === 403) {
        errorReason = "n8n returned 403 Forbidden ('Authorization data is wrong!'). Please configure N8N_AGENT_SECRET in .env or disable Authentication on the n8n Webhook node.";
      } else if (res.body) {
        errorReason += `: ${res.body.slice(0, 120)}`;
      }
      console.warn(`[n8nService] ${errorReason}`);
      return {
        success: false,
        isFallback: true,
        reason: errorReason,
        rawStatusCode: res.statusCode,
      };
    }

    let data;
    try {
      data = JSON.parse(res.body);
    } catch (parseErr) {
      // If n8n returned plain text (e.g. from an LLM output node), treat it as agenda/draft text
      data = { textOutput: res.body };
    }

    // Extract fields flexibly from whatever structure n8n returns
    const proposalData = data?.proposal || data?.data || data?.output || data;

    const proposedDate = isValidDateStr(proposalData.proposedDate || proposalData.meetingDate)
      ? (proposalData.proposedDate || proposalData.meetingDate).trim()
      : null;

    const proposedTime = isValidTimeStr(proposalData.proposedTime || proposalData.meetingTime)
      ? (proposalData.proposedTime || proposalData.meetingTime).trim()
      : null;

    const agenda = typeof (proposalData.agenda || proposalData.meetingAgenda) === "string"
      ? (proposalData.agenda || proposalData.meetingAgenda).trim()
      : typeof data.textOutput === "string"
      ? data.textOutput.trim()
      : "";

    const purpose = typeof (proposalData.purpose || proposalData.meetingPurpose) === "string"
      ? (proposalData.purpose || proposalData.meetingPurpose).trim()
      : payload.purpose || "Confidential Retention & Feedback Discussion";

    const draftSubject = typeof proposalData.invitationDraft?.subject === "string"
      ? proposalData.invitationDraft.subject.trim()
      : `Invitation: Confidential Workplace Feedback Discussion — ${empName}`;

    const draftMessage = typeof proposalData.invitationDraft?.message === "string"
      ? proposalData.invitationDraft.message.trim()
      : typeof proposalData.invitationDraft === "string"
      ? proposalData.invitationDraft.trim()
      : typeof data.textOutput === "string"
      ? data.textOutput.trim()
      : `Hi ${empName},\n\nWe would like to invite you to a confidential discussion regarding your workplace experience and how we can best support you.\n\nBest regards,\n${payload.hrName || "HR Team"}`;

    return {
      success: true,
      isFallback: false,
      proposal: {
        proposedDate,
        proposedTime,
        purpose,
        agenda,
        invitationDraft: {
          subject: draftSubject,
          message: draftMessage,
        },
        source: "n8n_agent",
        requestId,
      },
      raw: data,
    };
  } catch (err) {
    const isTimeout = err.message?.toLowerCase().includes("timed out");
    const reason = isTimeout
      ? `Connection to n8n timed out after ${N8N_TIMEOUT_MS / 1000}s.`
      : `Failed to contact n8n webhook: ${err.message}`;

    console.warn(`[n8nService] ${reason}`);

    return {
      success: false,
      isFallback: true,
      reason,
    };
  }
}

/**
 * Deterministic fallback generator for retention meeting proposal.
 * Used whenever the external n8n service is unavailable, unconfigured, or returns an error.
 *
 * @param {object} payload
 * @param {object} [availableSlot] - { meetingDate: "YYYY-MM-DD", meetingTime: "HH:MM" }
 * @returns {object}
 */
export function generateInternalRetentionProposal(payload, availableSlot = null) {
  const employeeName = payload.employeeName || "Team Member";
  const hrName = payload.hrName || "HR Team";
  const factors = Array.isArray(payload.riskFactors) && payload.riskFactors.length > 0
    ? payload.riskFactors
    : ["General workplace experience & role alignment check-in"];

  // Generate tailored discussion agenda points based on identified risk factors
  const agendaPoints = [
    "1. Welcome & confidential check-in (open dialogue on daily workload & role sentiment)",
    ...factors.map((f, i) => `${i + 2}. Address ${f} (collaborative review of feedback concerns & potential support solutions)`),
    `${factors.length + 2}. Action plan & mutually agreed next steps (workload adjustments, mentoring, growth pathways)`,
  ];

  const agenda = agendaPoints.join("\n");
  const purpose = payload.purpose || "Confidential Retention & Feedback Discussion";

  const slotDate = availableSlot?.meetingDate || payload.preferredDate || "";
  const slotTime = availableSlot?.meetingTime || payload.preferredTime || "";

  const timeContext = slotDate && slotTime ? ` on ${slotDate} at ${slotTime}` : "";

  const draftMessage =
    `Hi ${employeeName},\n\n` +
    `We would like to invite you to a confidential 1-on-1 discussion${timeContext} regarding your workplace experience, career development, and any support our team can provide.\n\n` +
    `Your feedback is deeply valued, and this discussion is focused entirely on understanding your perspective and improving your workplace experience.\n\n` +
    `Please let us know if this proposed time works for you, or if you would like to request an alternative time.\n\n` +
    `Best regards,\n${hrName}`;

  return {
    proposedDate: slotDate,
    proposedTime: slotTime,
    purpose,
    agenda,
    invitationDraft: {
      subject: `Invitation: Confidential Workplace Feedback Discussion — ${employeeName}`,
      message: draftMessage,
    },
    source: "internal_fallback",
  };
}
