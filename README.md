# READ ME

Setting up the project at home is easy.
1. First install node js
2. Install the reposititory on to your desktop
3. Next you will run `npm install in the root directory of this repository
4. After this, you should be able to run `npm run dev` to get a development server running.

# Task List
- [ ] Take notes on the subject
- [x] Make a list of task to complete
- [x] Goal: Make an app that can review labels on bottles, and verify that the contents of the label match the bottle.
	- [x] The app needs to be able to finish in 5 seconds
	- [x] The app needs to be able to handle mutiple uploads
	- [x] The app needs to be simple to use for elderly and new alike
	- [x] The app needs to succeed in the task
		- [x] Look up the criteria to compute the task.
		- [x] Set up API to access Azure or some sort of cloud system
			- [x] Identify a GPT interface that can work with government servers
				- [x] Look at what services are FedRAMP certified
				- [x] Try Perplexity
					- [x] Link Github Account
					- [x] Use Node to make local server in type script
						- [x] Choose Library for server functionality
						- [x] Test library (express)
						- [x] Make a web page that calls API from system
					- [x] Use **`pplx-decider-flash-v1.2`**
					- [x] Write code using this model
					- [x] If its good we can move on. (It didn't work)
				- [x] Try Gemini
				- [ ] Try GPT
			- [x] Learn interface's API
			- [x] Set up demo to test interface
		- [x] Find alcohol labels to check and test

# Thought Process:
I took notes on what I had to do to make the app. The next task was thinking of a solution to this problem. Its a computer vision problem, so the first step is always using the least powerful model to take on the task. Using simpler technology such as a  vision transformer and classical computer vision filtering to ease the image processing is not a bad idea. You can also do this without any cloud API which means it will be semi secure and mostly functional. I thought about these things, but I decided against it.  I decided that the simplest, and most robust method was to use the Gemini 3.5 Flash Lite API. As the government adds more criteria or removes criteria, the effort required to remove or add checks to Gemini are much easier than using a tuned or hard-coded set of parameters that the other methods would use.  The government at the time of writing this has access to Google Gemini through FedRAMP and so I felt that this app would have simple integration in the rest of the system.

My inital design of the project was in pure vanilla JS, I was using the Duck.ai and google Gemini 3.6 Flash to speed up development, by asking where documentation was, and having them generate functions, as well as reading the complicated details of the Governments information on the labeling system. I was able to get to a button in an HTML page, and access to a functioning Gemini API (held in a background server for security reasons). It was getting near the deadline, and I decided to further speed up my development by using google's AI studio. I didn't need this to complete the task (given I had a few more days to work on it), but I wanted to try it, and see the speed up it would provide.  When Gemini consumed my project, it decided that the vite frame work was the best choice for a UI system, and that type script would be a better choice than pure JavaScript. The reason AI tends to choose this is mainly due to the popularity  and heavy push of typescript. Type script also has the benefits of having types which helps reduce errors (type checking ensures the right object reaches the right slot). However, this is not that necessary in the modern times since we really don't touch the code as much as we used to. 

Just to provide some perspective. I was able to give three prompts to Gemini and it edited my  APP to the rough specks I had hoped for. AI is very good these days at following directions. It helps significantly that Gemini has direct access to Google's search as a ground truth

My plan was to make as much of a one button UI as possible. This is because in general, UIs tend to be way too complicated for most people when they first start, and possibly way too slow or way too confusing. In this particular task, we just need to upload some photos. That is it. Nothing else. This is one task. So you click the button, and it processes the files you give it. The benefit of a one button approach is that one can simply just click on all the files that you want to scan, and the system figures it out, and this is exactly what you want from an automated system, It matches files of labels that go together, together, so the user does not need to worry about familiarity or a cluttered confusing interface.

Over all I am relatively happy with the outcomes, and I hope this app will be helpful for many.

# Notes:
- The actual review process is pretty straightforward.
	- An agent pulls up an application, looks at the label artwork, and checks that what's on the label matches what's in the application. 
	- Brand name matches? Check. 
	- ABV is correct? Check. 
	- Government warning is there? Check. 
	- It takes maybe 5-10 minutes per application for a simple one, longer if there are issues.
- a lot of what we do is just... matching.
	- Like literally just making sure the number on the form is the same as the number on the label. 
	- My agents spend half their day doing what's essentially data entry verification
-  **If we can't get results back in about 5 seconds, nobody's going to use it.**
- We need something **my mother could figure out**—she's 73 and just learned to video call her grandkids last year, if that gives you a benchmark. 
	- Half our team is over 50.
	- Clean, obvious, no hunting for buttons.
-  Right now we literally have to process them one at a time.
	- If there was some way to **handle batch uploads**, that would be huge. 
- Oh, and our network blocks outbound traffic to a lot of domains, so keep that in mind if you're thinking about cloud APIs. 
	- During the scanning vendor pilot, half their features didn't work because our firewall blocked connections to their ML endpoints. Classic."
- Think of this as a standalone proof-of-concept that could potentially inform future procurement decisions.
- If it works well, maybe we look at how to incorporate it into the workflow. 
- But for a prototype? Just don't do anything crazy. We're not storing anything sensitive for this exercise.
- The thing about label review is there's nuance. 
	- You can't just pattern match everything.
	- Like, I had one last week where the brand name was 'STONE'S THROW' on the label but 'Stone's Throw' in the application. 
	- Technically a mismatch? Sure. 
	- But it's obviously the same thing. 
	- You need judgment.
- I literally have a printed checklist on my desk that I go through for every label.
	- Brand name—check with my eyes. 
	- ABV—check with my eyes. 
	- Warning statement—check with my eyes. It's 2024!
- The one thing I'd say is the warning statement check is actually trickier than it sounds.
	- It has to be **exact**.
	- Like, word-for-word, and the 'GOVERNMENT WARNING:' part has to be in all caps and bold.
	- Sarah probably mentioned this but people try to get creative with the warning all the time.
		- Smaller font,
		- different wording,
		- burying it in tiny text. 
	- I caught one last month where they used 'Government Warning' in title case instead of all caps. Rejected.
- Right now if an agent can't read the label they just reject it and ask for a better image.
	- But if AI could handle some of that..."
- You are free to use any programming languages, frameworks, or libraries you prefer. We want to see what kind of engineering, design, and integration decisions you make.
