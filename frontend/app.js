import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://ogoeydbprqrdimvoefnm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb2V5ZGJwcnFyZGltdm9lZm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODcyMTgsImV4cCI6MjA1OTI2MzIxOH0.LouHyANVXKRjgmh4gqKxTKhrai-tJKdYo9PSnzAnF9g";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to toggle section visibility
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

// Function to log in the user
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Login failed: " + error.message);
        console.error("Login failed:", error.message);
        return;
    }
    console.log("Logged in successfully", data);
    loadUserDashboard();
}

// Function to register a new user
//async function register() {
//    const email = document.getElementById('register-email').value;
//    const password = document.getElementById('register-password').value;
//    const role = document.getElementById('register-role').value;
//
//    // Sign up the user
//    const { data, error } = await supabase.auth.signUp({ email, password });
//
//    if (error) {
//        console.error("Registration failed:", error.message);
//        alert("Error: " + error.message);
//        return;
//    }
//
//    console.log("Registered successfully", data);
//
//    // Ensure the user exists before inserting into 'users' table
//    const { data: userData, error: userError } = await supabase.auth.getUser();
//
//    if (userError || !userData.user) {
//        console.error("No active user found");
//        alert("Registration successful, but login again to continue.");
//        return;
//    }
//
//    // Insert the user into the 'users' table
//    const { error: insertError } = await supabase
//        .from('users')
//        .insert([{ email, role }]);
//
//    if (insertError) {
//        console.error("Failed to insert user into users table:", insertError.message);
//        alert("Error adding user to database: " + insertError.message);
//    } else {
//        console.log("User added to users table");
//        alert("Registration successful! You can now log in.");
//        showSection('login');
//    }
//}
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Error: " + error.message);
        return;
    }

    alert("Registration successful! Please check your email to confirm your account before logging in.");

    // 🚀 Insert user into `users` table AFTER signing up
    const { error: insertError } = await supabase
        .from('users')
        .insert([{ email, role }]);

    if (insertError) {
        console.error("Failed to insert user into users table:", insertError.message);
    } else {
        console.log("User added to users table");
    }

    showSection('login');
}




// Function to log out the user
async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout failed:", error.message);
    } else {
        console.log("Logged out successfully");
        showSection('login');
    }
}

// Function to determine user role and load the correct dashboard
//async function loadUserDashboard() {
//    const { data: user, error: userError } = await supabase.auth.getUser();
//
//    if (userError || !user?.user) {
//        console.error("Error fetching authenticated user:", userError?.message);
//        alert("User authentication failed. Please log in again.");
//        return;
//    }
//
//    console.log("Authenticated user:", user.user.email);
//
//    // Fetch role using email
//    const { data: userData, error } = await supabase
//        .from('users')
//        .select('role')
//        .eq('email', user.user.email)
//        .maybeSingle();  // Ensures only one row is returned
//
//    if (error) {
//        console.error("Error fetching user role:", error.message);
//        alert("Failed to fetch user role. Please try again.");
//        return;
//    }
//
//    console.log("User Role:", userData.role);
//
//    if (userData.role === "client") {
//        showSection('client-dashboard');
//        document.getElementById('client-dashboard').classList.remove('hidden');
//        postJob();
//    } else if (userData.role === "freelancer") {
//        //showSection('freelancer-dashboard');
//        showSection('dashboard');
//        document.getElementById('freelancer-dashboard').classList.remove('hidden');
//        fetchJobs();
//      //  fetchJobs();
//    } else {
//        console.error("Invalid role detected");
//    }
//}
async function loadUserDashboard() {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
        console.error("Error fetching authenticated user:", userError?.message);
        alert("User authentication failed. Please log in again.");
        return;
    }

    const userEmail = user.user.email;
    console.log("Authenticated user:", userEmail);

    // Show the logged-in user's email in the navbar
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.textContent = `Logged in as: ${userEmail}`;
        userInfoElement.classList.remove('hidden');
    }

    // Fetch role using email
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', userEmail)
        .maybeSingle();

    if (error || !userData) {
        console.error("Error fetching user role:", error?.message || "No user role found");
        alert("Failed to fetch user role. Please try again.");
        return;
    }

    const userRole = userData.role;
    console.log("User Role:", userRole);

    // Role-based dashboard display
    if (userRole === "client") {
        showSection('dashboard');
        document.getElementById('client-dashboard').classList.remove('hidden');

        // ✅ Fetch client notifications (job applications)
        fetchClientNotifications();
    }
    else if (userRole === "freelancer") {
        showSection('dashboard');
        document.getElementById('freelancer-dashboard').classList.remove('hidden');

        // ✅ Fetch available jobs
        fetchJobs();

        // ✅ Fetch freelancer's applications
        fetchFreelancerApplications();
    }
    else {
        console.error("Invalid role detected");
        alert("Invalid role. Please contact support.");
    }
}

// Function to post a job (Client Only)
async function postJob() {
    const title = document.getElementById('job-title')?.value.trim();
    const description = document.getElementById('job-description')?.value.trim();
    const budget = document.getElementById('job-budget')?.value;
    const deadline = document.getElementById('job-deadline')?.value;

    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Budget:", budget);
    console.log("Deadline:", deadline);

    if (!title || !description || !budget || !deadline) {
        console.error("Job title and description cannot be empty.");
        alert("Please fill in all job details.");
        return;
    }

    // Get the logged-in user's email
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        console.error("Error getting client info:", userError?.message);
        alert("You must be logged in to post a job.");
        return;
    }

    const clientEmail = userData.user.email;

    const { error } = await supabase.from('jobs').insert([
        { title, description, budget, deadline, client_email: clientEmail, status: 'open' }
    ]);

    if (error) {
        console.error("Job posting failed:", error.message);
        alert("Failed to post job: " + error.message);
    } else {
        console.log("Job posted successfully");
        alert("Job posted successfully!");
        fetchJobs();  // Refresh job list
    }
}


// Function to fetch available jobs for freelancers
async function fetchJobs() {
    const jobList = document.getElementById('job-list');
    if (!jobList) {
        console.error("Job list element not found!");
        return;
    }

    const { data: jobs, error } = await supabase.from('jobs').select('*');

    if (error) {
        console.error("Error fetching jobs:", error.message);
        return;
    }

    jobList.innerHTML = ""; // Clear previous jobs

    if (jobs.length === 0) {
        jobList.innerHTML = "<p>No jobs available at the moment.</p>";
        return;
    }

    jobs.forEach(job => {
        const jobItem = document.createElement('div');
        jobItem.classList.add('job-item');
        jobItem.innerHTML = `
            <h4>${job.title}</h4>
            <p>${job.description}</p>
            <button onclick="applyJob('${job.id}')">Apply</button>
        `;
        jobList.appendChild(jobItem);
    });
}


// Function to apply for a job
// Function to apply for a job
async function applyJob(jobId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("User not logged in:", userError?.message);
        alert("You must be logged in to apply for jobs.");
        return;
    }

    const freelancerEmail = userData.user.email;

    // Check if the freelancer already applied for the job
    const { data: existingApplication } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('freelancer_email', freelancerEmail)
        .single();

    if (existingApplication) {
        alert("You have already applied for this job.");
        return;
    }

    // Fetch job details to get the client email
    const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('client_email, title')
        .eq('id', jobId)
        .single();

    if (jobError || !jobData) {
        console.error("Failed to fetch job details:", jobError?.message);
        alert("Error retrieving job details.");
        return;
    }

    const clientEmail = jobData.client_email;
    const jobTitle = jobData.title;

    // Insert the application into the applications table
    const { error: insertError } = await supabase.from('applications').insert([
        { job_id: jobId, freelancer_email: freelancerEmail, status: 'Pending' }
    ]);

    if (insertError) {
        console.error("Application failed:", insertError.message);
        alert("Failed to apply for job.");
        return;
    }

    console.log("Applied successfully");
    alert("Application submitted!");

    // Send a notification to the client
    await sendNotification(clientEmail, `A freelancer has applied for your job: "${jobTitle}"`);
}

// Function to send a notification to the client
async function sendNotification(clientEmail, message) {
    const { error } = await supabase.from('notifications').insert([
        { user_email: clientEmail, message }
    ]);

    if (error) {
        console.error("Failed to send notification:", error.message);
    } else {
        console.log("Notification sent to client:", clientEmail);
    }
}


// Function to fetch job applications (Client Only)
// Function to fetch job applications for the logged-in client
async function fetchApplications() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("User not logged in:", userError?.message);
        return;
    }

    const clientEmail = userData.user.email;

    // ✅ Fetch applications with job titles using a raw SQL function
    const { data: applications, error } = await supabase.rpc('fetch_client_applications', {
        client_email: clientEmail
    });

    if (error) {
        console.error("Error fetching applications:", error.message);
        return;
    }

    const appList = document.getElementById('applications-list');
    appList.innerHTML = "";

    if (!applications || applications.length === 0) {
        appList.innerHTML = "<p>No applications yet.</p>";
        return;
    }

    applications.forEach(app => {
        const appItem = document.createElement('div');
        appItem.innerHTML = `
            <p>Job: ${app.job_title}</p>
            <p>Freelancer: ${app.freelancer_email} | Status: ${app.status}</p>
            <button onclick="approveApplication(${app.id})">Approve</button>
            <button onclick="declineApplication(${app.id})">Decline</button>
        `;
        appList.appendChild(appItem);
    });
}


// Function to approve a freelancer's application (Client Only)
// Function to approve a freelancer's application
async function approveApplication(applicationId) {
    const { error } = await supabase
        .from('applications')
        .update({ status: 'Approved' })
        .eq('id', applicationId);

    if (error) {
        console.error("Approval failed:", error.message);
    } else {
        console.log("Application approved");
        alert("Application approved!");
        fetchApplications();
    }
}

// Function to decline a freelancer's application
async function declineApplication(applicationId) {
    const { error } = await supabase
        .from('applications')
        .update({ status: 'Declined' })
        .eq('id', applicationId);

    if (error) {
        console.error("Decline failed:", error.message);
    } else {
        console.log("Application declined");
        alert("Application declined.");
        fetchApplications();
    }
}

// Fetch applications for the logged-in freelancer
async function fetchFreelancerApplications() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("Error getting freelancer info:", userError?.message);
        return;
    }

    const freelancerEmail = userData.user.email;

    // ✅ Fetch applications with job titles using the new SQL function
    const { data: applications, error } = await supabase.rpc('fetch_freelancer_applications', {
        freelancer_email: freelancerEmail
    });

    if (error) {
        console.error("Error fetching freelancer applications:", error.message);
        return;
    }

    const applicationsList = document.getElementById('applications-list');
    if (!applicationsList) {
        console.error("Applications list element not found!");
        return;
    }

    applicationsList.innerHTML = ""; // Clear previous applications

    if (applications.length === 0) {
        applicationsList.innerHTML = "<p>No applications found.</p>";
        return;
    }

    applications.forEach(app => {
        const appItem = document.createElement('div');
        appItem.classList.add('application-item');
        appItem.innerHTML = `
            <p>Job: ${app.job_title} | Status: ${app.status}</p>
        `;
        applicationsList.appendChild(appItem);
    });

    console.log("Fetched freelancer applications:", applications);
}
async function fetchClientNotifications() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("User not logged in:", userError?.message);
        return;
    }

    const clientEmail = userData.user.email;  // Client email from authentication

    // ✅ Fetch notifications where `user_email` matches the client's email
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('message, created_at')
        .eq('user_email', clientEmail)  // Matching with `user_email`
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error.message);
        return;
    }

    const notifList = document.getElementById('notifications-list');
    if (!notifList) {
        console.error("Notifications list element not found!");
        return;
    }

    notifList.innerHTML = ""; // Clear old notifications

    if (notifications.length === 0) {
        notifList.innerHTML = "<p>No notifications yet.</p>";
        return;
    }

    notifications.forEach(notif => {
        const notifItem = document.createElement('div');
        notifItem.innerHTML = `
            <p><strong>Message:</strong> ${notif.message}</p>
            <p><small>${new Date(notif.created_at).toLocaleString()}</small></p>
        `;
        notifList.appendChild(notifItem);
    });

    console.log("Fetched client notifications:", notifications);
}





// Make functions accessible globally for HTML button clicks
window.showSection = showSection;
window.login = login;
window.register = register;
window.logout = logout;
window.postJob = postJob;
window.fetchJobs = fetchJobs;
window.applyJob = applyJob;
window.fetchApplications = fetchApplications;
window.fetchFreelancerApplications = fetchFreelancerApplications;
window.approveApplication = approveApplication;
window.declineApplication = declineApplication;  // ✅ Add this function
window.loadUserDashboard = loadUserDashboard;
window.sendNotification = sendNotification;
window.fetchClientNotifications = fetchClientNotifications;