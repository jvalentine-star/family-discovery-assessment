# Strategy Session v2 Apps Script install

This adds Strategy Session v2 without changing the existing Discovery Session or Strategy Session v1 backend.

## 1. Open the existing Apps Script project

Open **Family Assessment Responses** in Google Sheets.

Go to:

**Extensions → Apps Script**

Do not delete or replace the existing code.

## 2. Add a new script file

In Apps Script, click **+ → Script**.

Name it:

`StrategyV2`

Open the GitHub file:

`apps-script-strategy-v2-handler.gs`

Copy the complete contents into the new `StrategyV2.gs` file and save.

## 3. Add the new route to the existing doPost(e)

Find the existing `doPost(e)` function.

It already handles actions such as `discovery_submit` and `strategy_submit`.

After the request body has been parsed into a JavaScript object, add:

```javascript
if (payload.action === 'strategy_submit_v2') {
  return handleStrategySubmitV2_(payload);
}
```

If the existing parsed request variable is not called `payload`, use its actual name.

For example, if the existing code contains:

```javascript
const body = JSON.parse(e.postData.contents);
```

then use:

```javascript
if (body.action === 'strategy_submit_v2') {
  return handleStrategySubmitV2_(body);
}
```

Do not remove the existing `discovery_submit`, `load_discovery`, or `strategy_submit` handling.

## 4. Save and redeploy

Click **Save**.

Then:

**Deploy → Manage deployments**

Open the existing web-app deployment and choose **Edit**.

Select **New version** and deploy.

Keep the existing web-app settings:
- Execute as: Me
- Access: same as the current working deployment

If Google asks you to authorise the script again, approve the required Google Sheets permission.

Using **Manage deployments → Edit → New version** should preserve the same `/exec` URL, so the Discovery and Strategy web pages should not need a new endpoint.

## 5. Do not switch the public Strategy Session page yet

At this stage:
- `index.html` = Discovery Session, live
- `strategy-session.html` = Strategy v1, live
- `strategy-session-v2-preview.html` = Strategy v2 preview
- `strategy-session-v1-backup.html` = v1 backup

Once the backend is redeployed, return to ChatGPT and say:

**Apps Script v2 deployed**

The next validation will:
1. enable v2 preview submission to `strategy_submit_v2`
2. run a synthetic end-to-end submission
3. verify it lands in `Strategy Session v2 Responses`
4. confirm the Family ID and token linkage
5. only then replace `strategy-session.html` with v2
