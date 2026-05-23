export const rejectionReasons = [
  {
    category: "Inappropriate Content",
    feedback: {
      adult: "Your message contains inappropriate language or topics unsuitable for this program. Please ensure your messages are respectful and appropriate.",
      child: "Your message contains inappropriate language or topics. Please write about things that are friendly and suitable for your international pen pal."
    }
  },
  {
    category: "Personal Information Disclosure",
    feedback: {
      adult: "Your message includes personal information such as addresses or phone numbers. For safety reasons, please avoid sharing personal details.",
      child: "Your message includes personal details that should not be shared. For your safety, please avoid including things like addresses or phone numbers."
    }
  },
  {
    category: "Offensive or Discriminatory Language",
    feedback: {
      adult: "Your message contains language that could be considered offensive or discriminatory. Please use inclusive and respectful language.",
      child: "Your message includes comments that could hurt someone's feelings. Please write kind and positive messages."
    }
  },
  {
    category: "Poor or Unclear Writing",
    feedback: {
      adult: "Your message is difficult to understand due to unclear writing. Please revise for clarity and correctness.",
      child: "Your message is hard to read because of unclear or messy writing. Please try to write more clearly."
    }
  },
  {
    category: "Solicitation or Promotional Content",
    feedback: {
      adult: "Your message appears to be promoting products, services, or personal projects. Please keep messages focused on friendly and cultural exchange.",
      child: "Your message talks about things that are not part of our pen pal program. Please focus on sharing about your life, interests, and experiences."
    }
  },
  {
    category: "Off-Topic Content",
    feedback: {
      adult: "Your message discusses topics unrelated to the program. Please keep messages focused on cultural exchange and personal experiences.",
      child: "Your message discusses topics that are not related to your pen pal conversation. Try to stay focused on your daily life and interests."
    }
  },
  {
    category: "Incomplete Message",
    feedback: {
      adult: "Your message seems unfinished. Please make sure your message is complete before sending.",
      child: "Your message seems unfinished. Please complete your thoughts before sending."
    }
  },
  {
    category: "Harassment or Bullying",
    feedback: {
      adult: "Your message contains comments that could be interpreted as harassment or bullying. Please ensure all communication is respectful.",
      child: "Your message includes negative or hurtful comments. Please make sure your messages are kind and respectful."
    }
  },
  {
    category: "Scam or Misleading Content",
    feedback: {
      adult: "Your message contains content that may be misleading or inappropriate for this platform. Please avoid sharing deceptive or promotional material.",
      child: "Your message contains information that may not be true or appropriate. Please share honest and friendly messages."
    }
  }
];

export default rejectionReasons;