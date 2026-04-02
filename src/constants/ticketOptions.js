// src/constants/ticketOptions.js

export const TICKET_STATUSES = ["open", "pending", "closed"]

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"]

// Display labels — maps raw API value → human-readable dropdown label
export const STATUS_LABELS = {
  open:    "Open",
  pending: "Pending",
  closed:  "Closed",
}

export const PRIORITY_LABELS = {
  low:    "Low",
  normal: "Normal",
  high:   "High",
  urgent: "Urgent",
}
