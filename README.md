**This app is for tracking your cash flow**

Track your spendings and income like this:

![](./images/track.png)

Retrieve total spendings/income like this:

![](./images/analytics1.png)

Or like this:

![](./images/analytics2.png)

Backend of this app is hosted via Render.com's free tier, which spins down with 15 minutes of inactivity.

Since users data is stored in the filesystem (in transactions.db file), with each spin down, transactions.db file is reinitialized to its initial state.
