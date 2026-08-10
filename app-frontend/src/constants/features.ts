/**
 * Build-time feature switches for the mobile app.
 */

/**
 * In-app Razorpay checkout.
 *
 * OFF for the v1.0 App Store submission. The payment flow is not
 * operationally ready, and an App Store reviewer who reaches a payment
 * screen that then fails is a direct Guideline 2.1 rejection. With this
 * off, products surface "Get Quote" / "Contact to Purchase" instead and
 * there is no reachable payment path anywhere in the app.
 *
 * This is a client-side switch only — it does not touch the backend, so
 * the website's checkout keeps working. That's deliberate: the privacy
 * policy discloses Razorpay because the web genuinely uses it.
 *
 * Also note ProductDetailsScreen's "Buy Now" branch is separately
 * commented out. This flag is the belt to that braces: it blocks the
 * remaining route into checkout (the cart's "Proceed to Payment"), so
 * enabling prepaid on a product can't accidentally expose a broken flow.
 *
 * To re-enable in-app payments later:
 *   1. Confirm RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set in the
 *      production backend environment.
 *   2. Flip this to true.
 *   3. Un-comment the "Buy Now" branch in ProductDetailsScreen.
 *   4. Re-add "Financial Info → Payment Info" to the App Store Connect
 *      privacy questionnaire (see APP-STORE-SUBMISSION.md).
 */
export const IN_APP_CHECKOUT_ENABLED = false;
