# Project Overview
We developed a dashboard for users to view health metrics collected from a smartphone and wearable device. The main feature we were able to implement is an interactive sleep summary in a calendar view. Users can easily click on any day in the calendar to see more details from that day. The dashboard is built using the T3 stack, which includes Next.js and Tailwind CSS.

## Tech Stack
The following technologies are used in this project:
- Create T3 App
  - [Next.js](https://nextjs.org)
  - [Tailwind CSS](https://tailwindcss.com)

# Deployment

Create a `.env` file in the root directory of the project with the following content:
```
API_USERNAME=your_username
API_PASSWORD=your_password
```

Run the following command to build the Docker image for the dashboard:

```bash
docker build -t lucaslad5275/hc-dashboard:1.0 .
```

Run the following command to start the Docker container:

```bash
docker run -p 3000:3000 lucaslad5275/hc-dashboard:1.0
```
