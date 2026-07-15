**Incoming Orders**

The solution must collect all incoming inquiries and orders from various channels such as email, SMS, and requisitions into one central system.

The system must automatically process and structure the received information so that relevant data such as customer information, address, task type, and contact details are identified.

Based on this data, the solution must automatically generate and create an order in the work order management system.

The goal is for the system to automatically populate the majority of the required fields—expected to be around 80%—based on the available information.

The purpose is to reduce manual data entry, minimize errors, and ensure a more efficient and consistent creation of orders in the order management system.

Owner: Jesper Knopp

**Order / Work Management System**

Practical Information for the Task

All relevant access and contact information must be recorded directly on the order so that the technician has everything gathered in one place before arriving at the property.

This may include:

Location of the key box

Door, gate, or alarm codes

Property access conditions

Information about which entrances should be used or avoided

Parking information

Special instructions from the customer or property owner

On-site contact person(s)

Phone numbers and any alternative contact details

Practical notes regarding access, working hours, or safety

All information must be clearly presented and easily accessible to the employee directly within the order.

Owner: Jesper Knopp

**Question / Process Clarification**

What should be done if a task/job is received, but the requisition is only received several days later? Should the employee manually create the appointment in the calendar and in the order management system in the meantime?

**Create Invoice in the Order Management System**

AI-Generated Invoice Draft After Completed Work

When a job is completed, there is typically a large amount of information already available, such as labor hours, materials used, descriptions, and other relevant data.

Instead of requiring employees to manually copy and compile this information, AI can be used to automatically generate a draft invoice.

The AI should be able to generate approximately 90% of the invoice draft based on the information already available within the case/order. The employee then reviews the draft, corrects any errors, and adjusts the wording before the invoice is sent.

This approach makes the process faster and more efficient while still maintaining human oversight and quality control of the final result.

The employee simply clicks a function/button, after which the system automatically generates the invoice draft. The draft only needs to be reviewed and adjusted before being finalized.

Owner: Jesper Knopp

**Planning and Calendar**

**Automatic Creation of Planning Tasks in Outlook When an Order is Created**

Purpose

The purpose is to automate the creation of planning tasks, eliminating duplicate work between the order management system and the calendar.

When an order is created, a corresponding task should automatically be created in Microsoft Outlook, allowing it to be scheduled later using drag-and-drop functionality within the calendar.

Functional Description

1\. Order Creation

When a new order is created in the order management system:

All relevant information is stored, including:

Customer details

Address

Phone number

Job description

Images

Other relevant information

2\. Automatic Creation of Outlook Task

At the same time the order is created, a corresponding task should automatically be created in Outlook through an integration (for example, using the Microsoft Graph API).

The Outlook task should contain:

Title

Short description (e.g., customer name \+ task type)

Description

Customer information (name, phone number)

Address

Task description

Any notes

Attachments

Images or links to images/documents

Metadata (Optional)

Order number

Link to the order in the order management system

3\. Placement in Outlook

The task should be placed in a specific task list, such as:

Planning

Unscheduled

The task should not have a date or time assigned, so it appears as an unscheduled task.

4\. Scheduling Through Outlook

Within Outlook, the user should be able to:

View the task in the task list (typically in the side panel)

Drag the task into the calendar

Place it on the desired date and time

When the task is dragged into the calendar:

It should automatically be converted into a calendar appointment

All task information should be retained within the appointment

System Interaction

Two parallel entities will exist:

Order in the Order Management System (Master Data)

Task in Outlook (Planning)

These are logically connected but not necessarily fully synchronized.

Owner: Jesper Knopp

**Order Information Available to Technicians**

All relevant access and contact information must be recorded directly on the order so that the technician has everything gathered in one place before arriving at the property.

This may include:

Location of the key box

Door, gate, or alarm codes

Property access information

Which entrances should be used or avoided

Parking information

Special instructions from the customer or property owner

On-site contact person(s)

Phone numbers and alternative contact details

Practical notes regarding access, working hours, or safety

All information must be clearly displayed and easily accessible directly within the order to ensure efficient and trouble-free execution of the work.

**Planning / Calendar System**

Information Displayed in Calendar Appointments

The calendar system should contain practical information related to each task, ensuring that employees are fully informed before the visit.

The following information should be visible directly within the calendar appointment:

Address and appointment time

Customer and property information

Contact person and phone number

Key box location and relevant access codes

Property access instructions

Parking information and access routes

Special notes or conditions the technician should be aware of

The purpose is to gather all necessary information in one place so that planning, property access, and job execution become easier and more efficient for both office staff and technicians.

Owner: Jesper Knopp

**Google Maps Integration**

When a user opens a task in the calendar, there should be a clickable address link.

When the user clicks the link, Google Maps should automatically open and display the fastest route to the job location.

Alternatively, this can be implemented as a button:

"Open Route in Google Maps"

Owner: Jesper Knopp

**Creating a Follow-Up Planning Task for Incomplete Work**

The system must be able to create a new planning task in Outlook if a job cannot be completed.

Examples include:

The customer is not at home

The work cannot be carried out

The job remains unfinished for any other reason

The original task must not be moved because time has already been spent on that visit.

Instead, a new planning task should be created in Outlook for the remaining work that needs to be completed.

Owner: Jesper Knopp

**Status Indicators on Calendar Appointments**

Purpose

A clear and consistent method is required to display the status of calendar appointments so that all employees can quickly understand how far a job has progressed.

The goal is to improve visibility and eliminate uncertainty regarding whether an appointment has been planned, confirmed, or clarified with the customer.

The status should be visible directly on the calendar appointment, so employees do not need to open other systems or contact colleagues for updates.

Status Information

It should be possible to see whether:

The appointment has been created and scheduled

The customer has been contacted

The date, time, and scope of work have been agreed with the customer

The job is ready for execution

Additional clarification or action is required

**Miscellaneous items that don't have a fixed place**

There must be things here for which there is no rule.

**Followup of tasks**

Purpose

**The system should serve as a simple and fast place where all small tasks, reminders, and follow-up items can be collected in one central location.**

It must be easy to use during a busy workday, allowing users to quickly enter information by typing, speaking, or uploading photos directly into the system without spending time on administration.

Use Cases:

The system should be used for small tasks and reminders that are often received through:

Email

SMS

Phone calls

On-site job visits

These are tasks that can easily be forgotten during daily operations.

Examples include:

Documentation that needs to be sent

Items that need to be ordered

Customers that need to be called back

Photos from completed jobs

Addresses and location information

Errors and deficiencies that need attention

Small follow-up tasks that need to be completed later

Requirements

The system should make it easy to quickly save information so that users always know where it is stored.

Users should be able to open the system and immediately see outstanding tasks without having to search through multiple systems or locations.

The solution should function as a centralized overview of:

Small tasks

Documentation

Reminders

Follow-up activities

The goal is to make daily work more organized, manageable, and less stressful.

Owner: Jesper Knopp

**Status: Waiting for Customer**

Status Description

Status: Waiting for Customer

The customer has cancelled the appointment, and the case is therefore placed on hold until the customer returns with a new appointment time or provides additional information.

Short Status Text

Waiting for Customer – the customer has cancelled and will get back to us.

Owner: Jesper Knopp

**Task Images**

When working with images in the system, all work-related images must automatically be linked to the case or order they belong to.

Images contain location data that shows where the image was taken. This information can be used to automatically connect the image to the correct address on the order that is created.

In the order management system, it is possible to attach images, and the same applies to the calendar section. This means that when an image is received or taken, it is automatically saved to the relevant case or order.

This way, the employee who later receives the task will always have access to the images and therefore the best possible information basis.

At the same time, the person taking the image does not have to manually upload and place it correctly – this happens automatically.

Jesper Knopp

**Time Registration**

Time registration can be carried out via GPS, allowing the system to automatically register when an employee arrives at an address and when they leave again.

The registration is linked to the relevant case in the Order Management system, so it is always possible to see:

Which case the employee has visited

When the employee arrived

When the employee left

How much time was spent on the case

History of previous visits

To avoid errors, the system can first generate a suggested time registration.

The employee then only needs to approve it with a single click, after which the time is automatically added to the case in the Order Management system.

In this way, the company gains better oversight, more accurate time registration, and a clear history of where employees have been and how much time they have spent on individual tasks.

Jesper Knopp

**Daily Email Report**

A daily email should be generated and sent to us so we can see where we have been during the day.

**Calendar and Time Registration for Subcontractors**

We want a system where our subcontractors can access the tasks they need to perform directly through a calendar or app.

The purpose is that we only need to schedule the task once internally, after which the subcontractor can see the task, address, time, and relevant information directly in the system.

The subcontractor must be able to:

View assigned tasks in the calendar

View the address and information about the case

Upload images to the case

Register hours worked

Communicate with us regarding the task

Materials should not be registered manually by the subcontractor, as they are automatically linked to the case.

The system should give us a complete overview of which tasks the subcontractors have been assigned, how much time they have spent, and which images/documentation belong to each case.

The goal is to create simple and efficient communication between us and the subcontractors, so that planning, follow-up, time registration, and documentation are gathered in one place.

Jesper Knopp

**Quotations**

Function: Overview of Quotation Tasks

When an SMS, email, or other written inquiry regarding a potential job is received, the information must automatically be registered as a quotation task.

The system must be able to store all relevant information, including:

Images and attached files

Address

Name

Phone number

Email

Work description

Drawings and other materials

Information about what needs to be done

Any notes from the customer

The purpose is to create a complete overview of all quotations that need to be prepared.

This way, it is possible to quickly see:

Which quotations still need to be prepared

How many quotations are ready for pricing

Which customers need a response

Which information is missing before the quotation can be prepared

The system must make it easy to collect all incoming inquiries in one place, so that there is no loss of overview of the quotation work.

Jesper Knopp

It is an AI solution for plumbing quotations, where you can walk around at the customer’s location with your phone turned on and simply talk naturally about the job.

The system records the conversation and uses AI to automatically understand and divide the work into fixed quotation categories such as water, drainage, sanitary installations, ventilation, heating, underfloor heating, and fixture installation.

As the technician explains what needs to be done, the AI simultaneously registers information such as quantities, materials, locations, work tasks, and notes.

During the process, everything is automatically structured under the same fixed headings that the company normally uses in its quotations.

The solution must be able to integrate with the calendar or order management system, so that customer data and case information are already available before the visit.

When the visit is completed, the system automatically generates a finished quotation basis with professional descriptions and standard texts, which can be transferred directly to Excel or the company’s invoicing/accounting software.

The purpose is to save time on quotation writing, ensure consistent descriptions, and make it possible to prepare large parts of the quotation while still at the customer’s location, without subsequent manual writing work.

**Voice App**

The system must make it possible to receive a verbal order when nothing exists on paper.

The user simply speaks to the system, and it automatically converts the spoken information into a written order, which is then transferred directly to order processing, planning, and the calendar without manual data entry.

Jesper Knopp

There is a desire to develop a voice-controlled AI function that makes it possible to create professional emails directly through speech without the need for manual writing.

The solution should be aimed at people who work practically and are often on the move, for example craftsmen, project managers, or technicians, who need to quickly pass information on to customers, business partners, or colleagues.

The user must be able to speak freely and naturally to the system using short or incomplete messages, after which the system automatically converts the spoken content into a correctly formulated and professional email.

The function must be able to:

Understand everyday spoken language

Rewrite quick notes into understandable messages

Structure the text professionally

Adapt the tone to business communication

Be used directly from a mobile phone during work or transport

Save time in situations where the user does not have the opportunity to write manually

The system must be simple to use and function as a quick digital assistant for daily communication.

Jesper Knopp

**Property Data**

I would like a system where you can enter an address and automatically be shown all publicly available information about that property.

The system must be able to retrieve data from sources such as BBR, OIS, WebLager, utility companies, and other public registers.

The purpose is to quickly find relevant information such as:

Sewer drawings

Water and heating supply

BBR data

Utility maps

Property information

...everything needed in connection with a task at a property.

Jesper Knopp

**Plumbing App**

Water Flow Calculation

This function is used when a quick calculation is needed to determine which water flow and valve setting should be used in a system.

The user enters the most important information (e.g. pipe dimension, desired flow, pressure, valve type), and the system provides an approximate calculation of:

Expected water flow — how much water can pass through

Pressure drop across the valve — how much resistance the valve creates

Recommended valve setting — a realistic starting point for adjustment

Any adjustments — if the flow is too high or too low

The purpose is to provide the technician with quick, practical assistance when there is no written order or detailed documentation available.

🧠 What the Function Helps With

Verbal Orders

When only a verbal instruction is given on-site, the user can speak directly to the system.

The function converts the speech into:

A technically understandable calculation

An automatically generated order

Transfer to planning/calendar

This makes the work faster and minimizes errors.

📌 Example Text You Can Use in Your App

"This function is used to make quick calculations of water flow and valve settings. When the user enters or speaks the necessary information, the system automatically calculates an approximate flow, pressure drop, and a recommended valve setting. The function is especially useful when you only have a verbal order and need a technical assessment immediately."

Jesper Knopp

**Smart Product Assistance**

The system functions as a smart assistant where you simply take a picture of the product, controller, or text you need help with.

Based on the image, the system automatically finds the correct manual, guide, explanation, or video if one exists.

It can be used for everything within the trade – for example underfloor heating controls, heating controls, electrical components, and technical installations – and provides clear answers and step-by-step instructions.

🔧 What the System Does

Recognizes the product from a single image — you take a picture and the system identifies the model.

Finds manuals automatically — PDFs, guides, datasheets, or manufacturer information.

Translates text from the image — if something is written in German, Polish, English, etc.

Creates a simple guide — the system explains how to use or configure the product.

Answers questions about controls — underfloor heating, heating, thermostats, controllers, etc.

Finds videos — if a YouTube video exists, you get it immediately.

🧩 Example in Practice

You take a picture of an underfloor heating controller.

The system recognizes the model.

It finds the manual, translates it, and creates an easy guide.

If a video exists, you get that as well.

You can ask follow-up questions such as:

"How do I change the temperature?"

"How do I reset it?"

Jesper Knopp

**🔧 Purpose: A Central System for Troubleshooting and Experience Sharing**

You want to build a place where all your experiences with faults, problems, and solutions are gathered in one place.

It should be easy to look up information, easy to update, and easy to use in everyday work.

📚 What the System Should Contain

Cold water in the hot water line — typical causes, measurement methods, solutions

Lack of heating in buildings — air in the system, defective valves, circulation pumps, balancing

Odour problems — drains, soil stacks, leaks, vacuum valves

Noise from technical installations — pipe noise, pump problems, vibrations

Ventilation — insufficient extraction, pressure problems, dirty filters

Drains — blockages, drainage gradients, odour traps

Heating installations — supply/return, thermostats, shunt valves, mixing loops

🧠 What Experience Should Be Collected

Own experiences from operations, service, and emergency tasks

Experiences from colleagues — what has worked before

External solutions — suppliers, consultants, tradespeople

"Hidden tricks" — things you only learn by doing the work

Standard procedures — so everyone works the same way

🗂️ How It Can Be Organized

Here is one way to structure it:

Water — pressure, temperature, circulation, quality

Heating — radiators, underfloor heating, valves, pumps

Ventilation — extraction, air supply, filters, controls

Drains — odour, blockages, gradients, leaks

Plumbing in general — everything that applies across categories

Each category can contain:

Typical faults

Symptoms

Causes

Suggested solutions

What should be measured

What should be documented

Who to contact if the issue is not resolved

📝 Combined Text You Can Send to Colleagues

"We are in the process of collecting all our troubleshooting experience in a shared system. This includes everything from cold water in hot water lines, lack of heating, odour problems, noise from installations, ventilation, drains, and general plumbing challenges.

The purpose is to have a place where we can quickly look up typical faults, causes, and solutions — both what we have discovered ourselves and what others have successfully used.

The system will be divided into water, heating, ventilation, drains, and plumbing in general, making it easy to navigate. Everyone is welcome to contribute their experiences so that we can gather the knowledge that makes our work easier and more efficient."

Jesper Knopp

**Quality Assurance of Cases**

The purpose is to make quality assurance easy and straightforward to complete.

When quality assurance needs to be carried out on a case, the starting point is the goods and materials used on the case. This information can be found directly within the case in the order management system.

Based on the material list, a quality assurance report can be completed, documenting the work performed and the products used.

There are various templates and models that can be used for quality assurance. We would like to set up a solution where the report is simple to complete, allowing the employee to quickly select or enter the relevant information and submit the documentation.

The goals are:

To make quality assurance quick to complete.

To use information from the case in the order management system.

To ensure correct documentation of the goods and materials used.

To make the process consistent for all employees.

**Translation App**

The short version first:

You are describing an app/device that can take a picture of a product or a piece of text – and then automatically find user manuals, YouTube videos, translate the text, and explain step-by-step how to use the product.

📦 What Your “App/Device” Should Be Able to Do

Here is a clear and precise description of the functions, formulated so that it can be used as a specification or presentation:

🔍 Image Recognition

The user takes a picture of a product, a label, a button, a manual, or a display.

The app automatically recognizes the object or text.

🌐 Automatic Information Search

Finds relevant user manuals online.

Locates YouTube videos, guides, manuals, or FAQ pages.

Displays the best results directly in the app.

🌍 Text Translation

Translates text from the image into Danish or another desired language.

Can also explain technical words or symbols.

🛠️ Step-by-Step Explanation

The app creates a simple and understandable guide based on the material found.

Explains how to use, configure, or install the product.

Can also create a short “quick guide” for practical use.

📁 Save and Share Guides

The user can save guides for later use.

Option to share them with colleagues or family members.

🧩 What the Problem Is – and How the App Solves It

You are describing a very common situation:

You are standing with a product, a tool, or a device, and you have no idea how it works. The manual is missing, the language is wrong, or you cannot find the correct video.

The app solves this by doing three things in one step:

Take a picture

The app automatically finds all relevant information

You receive a clear guide without having to search yourself

🔧 Example of Use

You are standing with a machine where the buttons are in German.

You take a picture.

The app translates the text, finds the manual, and displays a video.

It creates a short explanation:

"Press here to start, turn this knob to adjust the power."

Jesper Knopp

**Accounting App**

Here is the text set up professionally:

Request for Overview in Reminder / Payment System

We want a complete overview of customers and invoices where there are payment issues.

The system must be able to show:

Which customers have received the 1st, 2nd, and 3rd reminder

Who needs to be contacted

Which invoices have not been paid

What has previously been sent to the customer

The customer's email, phone number, and address

Any errors, such as an incorrect invoice registration number or system error

Whether the case requires follow-up, email, or telephone contact

The purpose is to quickly see why a payment is missing and whether it is due to an error, misunderstanding, or non-payment.

It would also be an advantage if the system could generate a polite email to the customer, which we can quickly send before an actual reminder is issued.

In this way, we can react quickly and professionally without first having to search for information in the accounting system.

Jesper Knopp

**Service Reports / Plumbing Inspection**

When creating a service order, customer information must automatically be transferred into the service report.

This means that all relevant data from the order management system is already filled in before the technician starts the work.

The purpose is to avoid duplicate data entry and ensure that all service reports are consistent and correct.

The service report must therefore automatically contain information such as:

Customer name

Address

Contact information

Order number

Date

Technician / installer

Facility address

Any service agreement

The technician must then only complete the actual service work and the checks that have been performed on the installation.

This may include:

What has been checked

Measurements

Faults and deficiencies

Work performed

Replaced parts

Remarks

Customer signature

This workflow makes the documentation more professional and ensures that all necessary information is gathered in the same report without additional manual work.

Jesper Knopp

**SMS / Email to Customers**

When creating a task in the calendar, there must be an option to send an SMS or email directly to the customer.

The function must be able to be used as an alternative to calling the customer.

The message must inform the customer about:

Which day the task will be carried out

The expected time window for the visit

Whether the customer needs to be at home

How access to the rental property or location where the work is to be carried out will be obtained

There must be an option to choose whether an SMS or an email should be sent to the customer in connection with the task.

Jesper Knopp

**Message to the Customer if You Are Delayed**

You can create a system in the calendar where, with a single click, you can send a professional SMS or email to the customer if you are delayed.

The idea is:

The customer is created directly in the calendar appointment with name, phone number, and email.

When you can see that you will be delayed, you simply press a button.

The system automatically inserts the customer's details and sends a ready-made message.

You therefore avoid:

Finding the phone number

Writing the message every time

Spending time while driving between tasks

It can be implemented in:

Google Calendar

Outlook Calendar

Order Management System

Microsoft Planner

Simple mobile app

Or integrated with AI and automation

The message can automatically include:

The customer's name

The new expected arrival time

Your company name

Example:

"I am approximately 20 minutes delayed due to a previous task."

The advantages are:

The customer feels informed

Fewer unhappy customers

A more professional company

Less stress in everyday work

Faster workflow

It can also be extended with:

GPS/driving time

Automatic message in case of traffic delays

One-click action from the day's route

Speech-to-text

Standard messages for different situations

It is actually a very strong solution for the plumbing industry because a lot of time is spent on emergency jobs and delays.

Jesper Knopp

**Message to Customer When I Am on My Way**

An SMS message should be sent to the customer informing them that I am on my way and will arrive within half an hour.

We must be notified if the customer wants us to call or send a message when we are on our way.

