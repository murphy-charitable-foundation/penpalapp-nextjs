# How to Test Your Web Application on a Mobile Device Using Ngrok

This tutorial will guide you through testing your web applications on a mobile device while running them from your development platform using Ngrok.

---
## Prerequisites
Before you begin, ensure that you have Ngrok installed on your computer. If you haven't installed it yet:
1. Visit [Ngrok's official website](https://dashboard.ngrok.com/) or search for "Ngrok install" on your web browser.
2. Follow the installation steps provided on the website.
3. You will need to create a free Ngrok account for development and testing purposes.

---
## Step 1: Run Your Next.js Application
1. Open a terminal window.
2. Navigate to your project directory.
3. Start your Next.js application using the following command:
   ```sh
   npm run dev
   ```
4. You should see an output similar to the following:
   ```
   > myapp@0.1.0 dev
   > next dev
   ▲ Next.js 14.2.23
   - Local:        http://localhost:3000
   - Environments: .env.local
   ```
5. **Note the port number** after `localhost:` in the output (in this case, `3000`).

---
## Step 2: Expose Your Local Server Using Ngrok
1. Open a **new terminal window**.
2. Run the following command, replacing `<YOUR_PORT>` with the port number from Step 1:
   ```sh
   ngrok http http://localhost:<YOUR_PORT>
   ```
   For example, if your port number is `3000`, run:
   ```sh
   ngrok http http://localhost:3000
   ```
3. After running the command, you should see an output similar to this:
   ```
   Route traffic by anything: https://ngrok.com/r/iep
   Session Status                online
   Account                       example@gmail.com (Plan: Free)
   Version                       3.19.0
   Region                        United States (us)
   Latency                       63ms
   Web Interface                 http://127.0.0.1:4040
   Forwarding                    https://fe35-2001-569-f0e1-8200-79dd-a4e0-845a-2fc8.ngrok-free.app -> http://localhost:3000
   ```
4. **Copy the public URL** after `Forwarding:` (e.g., `https://fe35-2001-569-f0e1-8200-79dd-a4e0-845a-2fc8.ngrok-free.app`).

---
## Step 3: Access Your Application on a Mobile Device
1. Connect your mobile device to the same network as your development machine.
2. Open a web browser on your mobile device.
3. Paste the **Ngrok public URL** into the browser’s address bar and hit **Enter**.
4. Your development project should now be accessible on your mobile device!

---
## Additional Tips
- If your Ngrok session expires, simply rerun `ngrok http http://localhost:<YOUR_PORT>` to generate a new public URL.
- You can monitor requests and responses using Ngrok’s web interface at `http://127.0.0.1:4040`.
- Ensure your firewall or security settings do not block Ngrok from tunneling traffic.

Now you can seamlessly test your web applications on mobile devices while developing locally!
