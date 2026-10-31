import { describe, expect, it } from "vitest";
import { describeOrderStatus, matchesOrderFilter } from "@/lib/order-status";

describe("order status display", () => {
  it("maps every stored status to a customer-friendly label", () => {
    expect(describeOrderStatus("submitting").label).toBe("Pending");
    expect(describeOrderStatus("processing").label).toBe("In progress");
    expect(describeOrderStatus("submission_unknown").label).toBe("Being reviewed");
    expect(describeOrderStatus("completed").label).toBe("Completed");
    expect(describeOrderStatus("refunded").label).toBe("Refunded to credits");
  });
  it("keeps unknown provider statuses readable and active", () => {
    expect(describeOrderStatus("in_queue")).toMatchObject({ label: "In queue", group: "active" });
    expect(describeOrderStatus("").label).toBe("Unknown");
  });
  it("filters orders by group", () => {
    expect(matchesOrderFilter("processing", "active")).toBe(true);
    expect(matchesOrderFilter("completed", "active")).toBe(false);
    expect(matchesOrderFilter("cancelled", "closed")).toBe(true);
    expect(matchesOrderFilter("refunded", "all")).toBe(true);
  });
});
