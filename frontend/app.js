import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://ogoeydbprqrdimvoefnm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb2V5ZGJwcnFyZGltdm9lZm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODcyMTgsImV4cCI6MjA1OTI2MzIxOH0.LouHyANVXKRjgmh4gqKxTKhrai-tJKdYo9PSnzAnF9g";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


console.log("Supabase initialized:", supabase !== undefined);
// Function to toggle section visibility
function showSection(sectionId) {
     document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId)?.classList.add('active');
    
    if (sectionId === 'dashboard') {
        loadUserDashboard();
    }
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
    document.getElementById('logout-btn').classList.remove('hidden');
    loadUserDashboard();
    showSection('dashboard');
}

// Function to register a new user
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    if (!email || !password || !role) {
        alert("Please fill in all fields");
        return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Error: " + error.message);
        return;
    }

    // Insert user into 'users' table
    const { error: insertError } = await supabase
        .from('users')
        .insert([{ email, role }]);

    if (insertError) {
        console.error("Failed to insert user into users table:", insertError.message);
        alert("Registration successful, but there was an error saving your profile. Please contact support.");
    } else {
        alert("Registration successful! Please check your email to confirm your account before logging in.");
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
        document.getElementById('logout-btn').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
        showSection('landing');
    }
}

// Function to determine user role and load the correct dashboard
async function loadUserDashboard() {
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
        console.error("Error fetching authenticated user:", userError?.message);
        alert("User authentication failed. Please log in again.");
        showSection('login');
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
        document.getElementById('client-dashboard').classList.remove('hidden');
        document.getElementById('freelancer-dashboard').classList.add('hidden');
        fetchClientJobs();
        fetchClientApplications();
        fetchClientNotifications();
    } else if (userRole === "freelancer") {
        document.getElementById('freelancer-dashboard').classList.remove('hidden');
        document.getElementById('client-dashboard').classList.add('hidden');
        fetchJobs();
        fetchFreelancerApplications();
    } else {
        console.error("Invalid role detected");
        alert("Invalid role. Please contact support.");
    }
}

// Function to post a job (Client Only)
async function postJob() {
    const title = document.getElementById('job-title').value.trim();
    const description = document.getElementById('job-description').value.trim();
    const budget = document.getElementById('job-budget').value;
    const deadline = document.getElementById('job-deadline').value;

    if (!title || !description || !budget || !deadline) {
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
        document.getElementById('post-job-modal').classList.add('hidden');
        fetchClientJobs();
    }
}

// Function to fetch jobs posted by the client
async function fetchClientJobs() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const clientEmail = userData.user.email;
    const jobsList = document.getElementById('client-jobs-list');

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error.message);
        jobsList.innerHTML = "<p>Error loading jobs. Please try again.</p>";
        return;
    }

    jobsList.innerHTML = "";

    if (jobs.length === 0) {
        jobsList.innerHTML = "<p>You haven't posted any jobs yet.</p>";
        return;
    }

    jobs.forEach(job => {
        const jobItem = document.createElement('div');
        jobItem.classList.add('job-item');
        jobItem.innerHTML = `
            <h4>${job.title}</h4>
            <p>${job.description}</p>
            <p><strong>Budget:</strong> $${job.budget} | <strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${job.status}</p>
        `;
        jobsList.appendChild(jobItem);
    });
}

// Function to fetch available jobs for freelancers
async function fetchJobs() {
    const jobList = document.getElementById('job-list');
    if (!jobList) return;

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching jobs:", error.message);
        jobList.innerHTML = "<p>Error loading jobs. Please try again.</p>";
        return;
    }

    jobList.innerHTML = "";

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
            <p><strong>Budget:</strong> $${job.budget} | <strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
            <button class="btn btn-primary" onclick="applyJob('${job.id}')">Apply</button>
        `;
        jobList.appendChild(jobItem);
    });
}

// Function to apply for a job
async function applyJob(jobId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("User not logged in:", userError?.message);
        alert("You must be logged in to apply for jobs.");
        return;
    }

    const freelancerEmail = userData.user.email;

    // Check if already applied
    const { data: existingApplication } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('freelancer_email', freelancerEmail)
        .maybeSingle();

    if (existingApplication) {
        alert("You have already applied for this job.");
        return;
    }

    // Get job details
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

    // Insert application
    const { error: insertError } = await supabase.from('applications').insert([
        { job_id: jobId, freelancer_email: freelancerEmail, status: 'Pending' }
    ]);

    if (insertError) {
        console.error("Application failed:", insertError.message);
        alert("Failed to apply for job.");
        return;
    }

    // Send notification to client
    await sendNotification(jobData.client_email, `A freelancer has applied for your job: "${jobData.title}"`);

    alert("Application submitted successfully!");
    fetchJobs();
    fetchFreelancerApplications();
}

// Function to fetch applications for the logged-in client
async function fetchClientApplications() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const clientEmail = userData.user.email;
    const appList = document.getElementById('applications-list');

    const { data: applications, error } = await supabase
        .from('applications')
        .select(`
            id,
            status,
            created_at,
            freelancer_email,
            jobs (title)
        `)
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching applications:", error.message);
        appList.innerHTML = "<p>Error loading applications. Please try again.</p>";
        return;
    }

    appList.innerHTML = "";

    if (!applications || applications.length === 0) {
        appList.innerHTML = "<p>No applications yet.</p>";
        return;
    }

    applications.forEach(app => {
        const appItem = document.createElement('div');
        appItem.classList.add('application-item');
        appItem.innerHTML = `
            <h4>${app.jobs?.title || 'No title'}</h4>
            <p><strong>Freelancer:</strong> ${app.freelancer_email}</p>
            <p><strong>Status:</strong> ${app.status}</p>
            <p><small>Applied on: ${new Date(app.created_at).toLocaleString()}</small></p>
            <div class="mt-20">
                <button class="btn btn-success" onclick="updateApplicationStatus('${app.id}', 'Approved')">Approve</button>
                <button class="btn btn-danger" onclick="updateApplicationStatus('${app.id}', 'Declined')">Decline</button>
            </div>
        `;
        appList.appendChild(appItem);
    });
}

// Function to fetch applications for the logged-in freelancer
async function fetchFreelancerApplications() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const freelancerEmail = userData.user.email;
    //const appList = document.getElementsByClassName('applications-list');
    const appList = document.getElementById('applications-list');
    if (!appList) {
      console.error("Element with id 'applications-list' not found.");
      return;
    }
    const { data: applications, error } = await supabase
        .from('applications_with_job_titles')
        .select('*')
        .eq('freelancer_email', freelancerEmail)
        .order('status', { ascending: true });

    if (error) {
        console.error("Error fetching applications:", error.message);
        appList.innerHTML = "<p>Error loading applications. Please try again.</p>";
        return;
    }

    appList.innerHTML = "";

    if (!applications || applications.length === 0) {
        appList.innerHTML = "<p>You haven't applied to any jobs yet.</p>";
        return;
    }

    applications.forEach(app => {
        const appItem = document.createElement('div');
        appItem.classList.add('application-item');
        appItem.innerHTML = `
            <h4>${app.title || 'No title'}</h4>
            <p><strong>Status:</strong> ${app.status}</p>

        `;
        appList.appendChild(appItem);
    });
        console.log("Fetched freelancer applications:", applications);
//    applications.forEach(app => {
//      const li = document.createElement('li');
//      li.textContent = `Status: ${app.status}, Job Title: ${app.jobs?.title}`;
//      appList.appendChild(li);
//    });
}

// Function to update application status
async function updateApplicationStatus(applicationId, status) {
    const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

    if (error) {
        console.error(`Failed to ${status.toLowerCase()} application:`, error.message);
        alert(`Failed to update application status: ${error.message}`);
        return;
    }

    // Get application details to send notification
    const { data: application } = await supabase
        .from('applications')
        .select('freelancer_email, jobs(title)')
        .eq('id', applicationId)
        .single();

    if (application) {
        const message = `Your application for "${application.jobs?.title || 'the job'}" has been ${status.toLowerCase()}`;
        await sendNotification(application.freelancer_email, message);
    }

    alert(`Application ${status.toLowerCase()} successfully!`);
    fetchClientApplications();
}

// Function to fetch client notifications
async function fetchClientNotifications() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const clientEmail = userData.user.email;
    const notifList = document.getElementById('notifications-list');

    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', clientEmail)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error.message);
        notifList.innerHTML = "<p>Error loading notifications. Please try again.</p>";
        return;
    }

    notifList.innerHTML = "";

    if (!notifications || notifications.length === 0) {
        notifList.innerHTML = "<p>No notifications yet.</p>";
        return;
    }

notifications.forEach(notif => {
    const notifItem = document.createElement('div');
    notifItem.classList.add('application-item');
    notifItem.innerHTML = `
        <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #333;">New Notification</h2>
        <h4 style="margin: 0 0 4px 0; font-weight: normal; color: #555;">${notif.message}</h4>
        <p style="margin: 0; font-size: 12px; color: #888;">
            <small>${new Date(notif.created_at).toLocaleString()}</small>
        </p>
    `;
    notifList.appendChild(notifItem);
});

}

// Function to send a notification
async function sendNotification(userEmail, message) {
    const { error } = await supabase.from('notifications').insert([
        { user_email: userEmail, message }
    ]);

    if (error) {
        console.error("Failed to send notification:", error.message);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            document.getElementById('logout-btn').classList.remove('hidden');
            loadUserDashboard();
            showSection('dashboard');
        }
    });
});

// Make functions accessible globally for HTML button clicks
window.showSection = showSection;
window.login = login;
window.register = register;
window.logout = logout;
window.postJob = postJob;
window.fetchJobs = fetchJobs;
window.applyJob = applyJob;
window.fetchClientApplications = fetchClientApplications;
window.fetchFreelancerApplications = fetchFreelancerApplications;
window.updateApplicationStatus = updateApplicationStatus;
