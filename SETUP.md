# Setting up the new data entry form

This replaces the Make.com + photo pipeline with a direct web form at `entry.html`. Supervisors fill in a tab (Handles, Printing, Tufting, Trimming, Packaging, or Attendance) and hit Submit — it writes straight into `data.json` on GitHub, and the dashboard (`index.html`) picks it up automatically within ~30 seconds.

To make this work you need to do two one-time things in Vercel: give it a GitHub token so it's allowed to write to the repo, and set a PIN so random people can't submit data. Follow the steps below in order — none of it requires writing code, just clicking through two websites.

## 1. Create a GitHub token

This is a password-like key that lets the form write to `data.json` on your behalf.

1. Go to [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) (make sure you're logged into the `nivesh-sudo` account).
2. Click **Generate new token**.
3. Give it a name, e.g. `factory-dashboard-form`.
4. Under **Repository access**, choose **Only select repositories** and pick `greenedge-factory-dashboard`.
5. Under **Permissions → Repository permissions**, find **Contents** and set it to **Read and write**. Leave everything else as-is.
6. Click **Generate token** at the bottom.
7. Copy the token that appears (it starts with `github_pat_...`). You won't be able to see it again — paste it somewhere safe for the next step.

## 2. Add the token and a PIN to Vercel

1. Go to [vercel.com](https://vercel.com) and open the `greenedge-factory-dashboard` project.
2. Click **Settings** → **Environment Variables**.
3. Add a variable named `GH_TOKEN`, paste the token from step 1 as the value, and save.
4. Add a second variable named `SUPERVISOR_PIN`, and set the value to whatever PIN you want supervisors to use (e.g. a 4-6 digit number). This is what stops strangers from submitting data if they find the link.
5. Make sure both variables are enabled for **Production**.
6. Go to the **Deployments** tab, open the latest deployment, and click **Redeploy** (this makes the new environment variables take effect).

## 3. Test it

1. Open your Vercel site's `/entry.html` page.
2. Pick today's date, enter the PIN you set, add one test row on any tab, and hit Submit.
3. You should see a green confirmation message. Open `data.json` in the GitHub repo — you should see a new commit and today's date inside `reports`.
4. Open `/index.html` — the numbers should reflect what you just entered (it may take up to 30 seconds, or refresh the page).

If you see a red error message instead, it will tell you what's wrong (usually a missing/incorrect PIN, or the token not being set up correctly — re-check step 2).

## 4. Roll it out to supervisors

- Share the `/entry.html` link and the PIN with your supervisors (e.g. over WhatsApp), separately if you want a bit more security.
- Each tab submits on its own — a supervisor doesn't need to fill in every tab, and different people can submit different tabs (e.g. one for Handles, another for Attendance) throughout the day without overwriting each other.
- Once you've confirmed a few days of data are coming in correctly, turn off the Make.com scenario that was processing the photos — it's no longer needed.

## Notes and limits

- The PIN is a simple shared password, not individual logins — anyone with the PIN can submit or overwrite that day's data for a section. Good enough for an internal tool with a small trusted team; let me know if you want per-person accounts later.
- If two people submit the *same* tab for the *same* date, the second submission overwrites the first for that tab (other tabs are untouched).
- The GitHub token only has write access to this one repository, not your whole GitHub account.
