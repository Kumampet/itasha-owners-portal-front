# Application Name: Itasha Owners Portal (痛車オーナーズポータル)

## Description

The Itasha Owners Portal is a specialized, non-commercial information platform and community management tool designed for the "Itasha" (cars decorated with fictional characters) community in Japan. Its primary goal is to centralize highly fragmented event information and provide stable communication tools, mitigating the pain points and risks associated with over-reliance on platforms like X (Twitter) for critical event management.

## Core Features

- **Centralized Event List**: Aggregated, verified, and updated list of Itasha events, complete with dates, deadlines, and organizer information.

- **Group Management ("Awase" Support)**: A secure, dedicated space for users to organize group participations ("Awase"), replacing unstable and restrictive platforms like X Direct Messages (DMs).

- **Deadline Reminders**: System to send PWA push notifications and email reminders for important deadlines (entry start, payment due).

## Intended Use of the X API (Justification for Developer Access)

The primary purpose for requesting Developer Access is to provide secure, convenient Single Sign-On (SSO) functionality using users' existing X accounts. This application is designed to be X-independent for core community management, but API access is essential for the following low-volume functions:

### Single Sign-On (SSO) and User Profile Creation (Primary Use)

- To allow users to sign in and create their unique portal profile instantly using their verified X account, removing the need for a separate email/password setup.

- We will only retrieve basic, public profile information necessary for portal operation (X User ID, Display Name, Profile Picture URL). We will not access private data such as Direct Messages, followers' lists, or personalized timelines.

- This improves user onboarding speed and security.

### User Convenience and Sharing (Write-Only/Low Volume)

- To allow users, upon their explicit consent, to easily share public information (e.g., their intent to participate in an event) directly onto X from our platform.

- This is a standard social sharing function that improves event visibility and community reach. We will not use the API for mass posting or automated content creation.

## Usage Volume

The anticipated API usage volume will be low. Data consumption will primarily consist of:

- User sign-in events (authentication)
- User-initiated shares

We will not be:

- Pulling timelines
- Monitoring large volumes of public posts
- Performing competitive analysis

Our focus remains on platform stability and secure authentication.

