// Fulfillment panel — server component rendered on the admin order detail page.
// Shows the quote request button, quote table, recommendation banner,
// vendor selection form, and submit-to-vendor action.

import { formatCents } from "@/lib/pricing";
import type { Order, FulfillmentQuote } from "@/lib/db/schema";
import {
  requestQuotesAction,
  selectVendorAction,
  submitToVendorAction,
} from "./actions";

interface Props {
  order: Order;
  quotes: FulfillmentQuote[];
}

// Statuses where the fulfillment panel is relevant.
const FULFILLMENT_ACTIVE_STATUSES = [
  "proof_approved",
  "submitted_to_vendor",
  "fulfillment_failed",
] as const;

export function FulfillmentPanel({ order, quotes }: Props) {
  const status = order.status;

  // Only show for orders that have reached the fulfillment stage.
  if (!(FULFILLMENT_ACTIVE_STATUSES as readonly string[]).includes(status)) {
    return null;
  }

  const rec = order.fulfillmentRecommendation;
  const sel = order.fulfillmentSelection;

  const isSubmitted = status === "submitted_to_vendor";
  const hasFailed = status === "fulfillment_failed";
  // Allow re-requesting quotes from fulfillment_failed so admin can retry
  // without first having to manually reset the status.
  const canRequest = status === "proof_approved" || status === "fulfillment_failed";
  // Submission requires proof_approved — fulfillment_failed retry goes:
  // re-request quotes → select vendor → reset status to proof_approved → submit.
  const canSubmit = status === "proof_approved" && sel !== null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Fulfillment
      </h2>

      <div className="rounded border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">

        {/* ------------------------------------------------------------------ */}
        {/* Already submitted                                                    */}
        {/* ------------------------------------------------------------------ */}
        {isSubmitted && (
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200">
              submitted to vendor
            </span>
            {sel && (
              <span className="text-sm text-gray-500">
                Vendor: <strong className="text-gray-900">{sel.vendorId}</strong>
              </span>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Fulfillment failed                                                   */}
        {/* ------------------------------------------------------------------ */}
        {hasFailed && (
          <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50">
            Submission to vendor failed. Review the submission log and retry.
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Recommendation banner                                                */}
        {/* ------------------------------------------------------------------ */}
        {rec && !isSubmitted && (
          <div className="px-4 py-3 bg-indigo-50 text-sm">
            <span className="font-medium text-indigo-800">Recommended:</span>{" "}
            <span className="text-indigo-700">
              <strong>{rec.vendorId}</strong> —{" "}
              {formatCents(rec.quotedCents)} production +{" "}
              {formatCents(rec.shippingCents)} shipping ·{" "}
              <span className={rec.marginCents >= 0 ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                {formatCents(rec.marginCents)} margin
              </span>
              {rec.turnaroundDays !== undefined && (
                <> · {rec.turnaroundDays} day{rec.turnaroundDays !== 1 ? "s" : ""}</>
              )}
            </span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Selected vendor banner                                               */}
        {/* ------------------------------------------------------------------ */}
        {sel && !isSubmitted && (
          <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50 flex items-center gap-2">
            <span className="font-medium text-gray-900">Selected:</span>
            <strong>{sel.vendorId}</strong>
            {sel.isOverride && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200">
                override
              </span>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Quote table                                                          */}
        {/* ------------------------------------------------------------------ */}
        {quotes.length > 0 && !isSubmitted && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Vendor", "Production", "Shipping", "Total Cost", "Margin", "Days", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {quotes.map((q) => {
                  const isRec = rec?.quoteId === q.id;
                  const isSel = sel?.quoteId === q.id;
                  const totalCost = q.quotedCents + q.shippingCents;

                  return (
                    <tr
                      key={q.id}
                      className={isSel ? "bg-indigo-50" : isRec ? "bg-green-50/40" : ""}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {q.vendorId}
                        {isRec && (
                          <span className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-200">
                            rec
                          </span>
                        )}
                        {isSel && (
                          <span className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-200">
                            selected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatCents(q.quotedCents)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatCents(q.shippingCents)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatCents(totalCost)}
                      </td>
                      <td className={`px-4 py-3 font-medium whitespace-nowrap ${
                        (q.marginCents ?? 0) >= 0 ? "text-green-700" : "text-red-600"
                      }`}>
                        {formatCents(q.marginCents ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {q.turnaroundDays != null ? `${q.turnaroundDays}d` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canRequest && !isSel && (
                          <form action={selectVendorAction}>
                            <input type="hidden" name="orderId" value={q.orderId} />
                            <input type="hidden" name="quoteId" value={q.id} />
                            <input type="hidden" name="vendorId" value={q.vendorId} />
                            <input
                              type="hidden"
                              name="isOverride"
                              value={(!isRec).toString()}
                            />
                            <button
                              type="submit"
                              className={`rounded px-3 py-1 text-xs font-medium text-white transition-colors ${
                                isRec
                                  ? "bg-green-700 hover:bg-green-600"
                                  : "bg-gray-700 hover:bg-gray-600"
                              }`}
                            >
                              {isRec ? "Confirm" : "Override"}
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Actions row                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 bg-gray-50">
          {/* Request / re-request quotes */}
          {canRequest && (
            <form action={requestQuotesAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {quotes.length > 0 ? "Re-request Quotes" : "Request Quotes"}
              </button>
            </form>
          )}

          {/* Submit to vendor */}
          {canSubmit && (
            <form action={submitToVendorAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="rounded bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
              >
                Submit to {sel!.vendorId}
              </button>
            </form>
          )}

          {/* No quotes yet and not proof_approved */}
          {!canRequest && quotes.length === 0 && (
            <p className="text-sm text-gray-400">
              Request quotes once the proof is approved.
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
