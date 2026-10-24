/**
 * Page copy for Home, About and shared sections.
 * All wording is taken from the existing Brand Image website unless noted.
 */
module.exports = {
  about: {
    eyebrow: 'About Brand Image Media Pvt Ltd',
    quote: 'Business has only two functions – “Marketing and Innovation.”',
    experience: { value: 12, suffix: '+', label: 'Years Experience' },
    // “Who We Are” section on the About page
    whoWeAre: {
      greeting: 'Welcome to Brand Image Media Pvt. Ltd.',
      paragraphs: [
        'With <strong>12+ years of experience</strong>, Brand Image Media Pvt. Ltd. is an integrated <strong>advertising and branding company</strong> specializing in <strong>Printing, Retail Branding, Outdoor Advertising and Events</strong>.',
        'We combine creative thinking, strategic planning and quality execution to help brands build strong visibility and connect with their target audiences. Our experienced team works closely with clients to understand their objectives and deliver effective, impactful solutions.',
        'We provide end-to-end solutions that help businesses strengthen their brand presence and achieve their marketing goals.',
      ],
    },
    // Home page "About" section (existing home page copy)
    paragraphs: [
      'Brand Image Media Pvt Ltd is a highly skilled and dynamic advertising agency that specializes in assisting clients in reaching their target audiences through innovative and customized solutions. With our team of experienced professionals, we take great pride in our ability to comprehend your specific needs and offer creative services that can truly make a difference. With over 12 years of valuable experience in the field of Printing, Branding, Advertising, and Events, we have gained extensive knowledge and expertise in executing successful campaigns. Our agency, Brand Image Advertising, has been recognized with prestigious awards for our compelling advertising campaigns.',
      'At Brand Image Media Pvt Ltd, we understand the importance of creating a strong brand image for your business. Through our expertise in branding, we can help you establish a distinct and memorable identity that resonates with your target market. Whether it\'s designing logos, developing brand guidelines, or creating comprehensive brand strategies, our team is dedicated to delivering exceptional results.',
      'In addition to branding, we excel in various advertising mediums. From traditional print advertisements to campaigns, we stay up-to-date with the latest trends and technologies to ensure maximum impact for your message. Our advertising solutions are tailored to your specific goals, whether it\'s increasing brand awareness, driving website traffic, or generating leads.',
      'Furthermore, our proficiency in event management allows us to create memorable experiences that leave a lasting impression. From corporate conferences to product launches, we handle every aspect of event planning, ensuring seamless execution and exceptional attendee experiences.',
      'At Brand Image Media Pvt Ltd, we prioritize client satisfaction and strive to build long-lasting partnerships. We believe in effective communication, collaborative teamwork, and attention to detail, which are the pillars of our successful projects. We are committed to delivering results that exceed your expectations and contribute to your business growth.',
      'Thank you for choosing Brand Image Media Pvt Ltd as your advertising partner. We look forward to working with you and helping you achieve your marketing objectives with our expertise and creativity.',
    ],
    // About page introduction (existing About page copy)
    welcome:
      'Welcome to Brand Image Media Pvt Ltd! We are an experienced and dynamic advertising agency, helping clients reach their target audiences through innovative solutions tailored to every campaign. With our team of professionals, we take pride in being able to understand your needs and provide creative services that can make a real difference. More Than 12 years of experience in the field of Printing, Branding, Advertising & Events. Brand Image Advertising is an award-winning agency providing compelling advertising campaigns for our clients. We bring together decades of experience, insight, and strategic vision to develop strategies that both grab attention and deliver measurable results. Whether your goal is to reach a broad audience or find prospects in the local market, we can help you build effective campaigns that reach your desired objectives.',
    mission:
      'Our mission is to help businesses and organizations achieve their marketing goals by creating impactful and innovative advertising campaigns that effectively communicate their message to their target audience. We strive to deliver exceptional results for our clients by utilizing our expertise in strategy, creativity, and technology.',
    // Existing sentence: "We believe in effective communication, collaborative teamwork, and attention to detail, which are the pillars of our successful projects."
    pillars: [
      { title: 'Effective Communication', icon: 'messages-square' },
      { title: 'Collaborative Teamwork', icon: 'users' },
      { title: 'Attention to Detail', icon: 'scan-eye' },
    ],
    // About page "Who We Are" feature cards (wording from the About section redesign brief)
    highlights: [
      { title: 'Creative Solutions', text: 'Ideas that work', icon: 'lightbulb', tone: 'orange' },
      { title: 'Expert Team', text: 'Driven by passion', icon: 'users', tone: 'blue' },
      { title: 'Measurable Results', text: 'Growth focused', icon: 'trending-up', tone: 'dark' },
    ],
    // Core strengths — each paragraph is existing copy from the home page
    strengths: [
      { title: 'Branding', icon: 'pen-tool', textIndex: 1 },
      { title: 'Advertising', icon: 'megaphone', textIndex: 2 },
      { title: 'Event Management', icon: 'party-popper', textIndex: 3 },
    ],
  },

  // "Why choose us" — every description quotes the existing website
  whyUs: {
    eyebrow: 'Why Choose Us',
    title: 'One stop solution for branding, advertising and activation',
    intro: [
      'We offer complete solutions across <strong>printing, branding, advertising and outdoor media</strong> under one roof.',
      'With creative thinking and quality execution, we help brands build a <strong>strong and consistent market presence</strong>.',
      'Our focus is on <strong>reliable service, attention to detail and impactful communication</strong>.',
      'We work closely with our clients to deliver effective solutions that support their <strong>business growth</strong>.',
    ],
    items: [
      {
        icon: 'award',
        title: '12+ Years of Experience',
        text: 'More than 12 years of experience in the field of Printing, Branding, Advertising & Events.',
      },
      {
        icon: 'sparkles',
        title: 'Innovative & Customized Solutions',
        text: 'We assist clients in reaching their target audiences through innovative and customized solutions.',
      },
      {
        icon: 'users',
        title: 'Experienced Professionals',
        text: 'We take great pride in our ability to comprehend your specific needs and offer creative services that can truly make a difference.',
      },
      {
        icon: 'heart-handshake',
        title: 'Client Satisfaction',
        text: 'We prioritize client satisfaction and strive to build long-lasting partnerships.',
      },
      {
        icon: 'calendar-check',
        title: 'Timely Delivery',
        text: 'Our streamlined printing process and efficient workflow enable us to meet even the tightest deadlines without compromising on quality.',
      },
      {
        icon: 'badge-indian-rupee',
        title: 'Affordable Pricing',
        text: 'We offer competitive and transparent pricing options that cater to various budgets.',
      },
    ],
  },

  // Existing "How we work" process
  process: [
    {
      icon: 'clipboard-list',
      title: 'Client Brief',
      text: 'A client brief is a document that outlines the requirements and scope of a project or campaign as set forth by a client.',
    },
    {
      icon: 'lightbulb',
      title: 'Brainstorming',
      text: "Brainstorming is a general technique for coming up with an idea, but sometimes it's not good enough to just sit down and tell yourself you're going to brainstorm until you get an idea.",
    },
    {
      icon: 'presentation',
      title: 'Present',
      text: 'Discuss the common demographics of the market, where people shop and how they spend, all of which you will use to justify your creative ideas.',
    },
    {
      icon: 'rocket',
      title: 'Deliver',
      text: 'The term Ad Delivery means the delivery of online advertisements or advertising-related services using Ad Reporting Data.',
    },
  ],

  // Existing testimonials ("Our Best Reviews"). Not shown on the site: the reviews section was removed
  // at the client's request. Kept here in case it is brought back.
  testimonials: [
    {
      name: 'Vaibhav Patil',
      role: 'Business Owner',
      image: null, // the old photo was a stock placeholder from the website template
      text: 'I take great pleasure in writing to acknowledge the excellent experiences we had while working with Brand Image. The high levels of professionalism, expertise and attention to detail reflected through the dynamic team.',
    },
    {
      name: 'Sagar Thakare',
      role: 'Marketing Manager',
      image: 'person-sagar',
      text: 'We have been working across the region with Brand Image for several years and are always impressed by their ‘can do’ attitude, creative ideas and flawless execution.',
    },
    {
      name: 'Sureka Sarode',
      role: 'Business Owner',
      image: 'person-sureka',
      text: 'From start to finish the journey with Brand Image has been nothing but exceptional. It was an incredible event.',
    },
  ],

  servicesIntro: {
    eyebrow: 'Our Services',
    title: 'We help you to establish your Brand presence',
  },

  galleryCategories: [
    { key: 'printing', label: 'Printing' },
    { key: 'shop-branding', label: 'Shop Branding' },
    { key: 'outdoor', label: 'Outdoor Media' },
    { key: 'transit', label: 'Transit Media' },
    { key: 'wall-painting', label: 'Wall Painting' },
    { key: 'events', label: 'Events' },
    { key: 'promotional', label: 'Promotional' },
    // Shown automatically once photos with category 'workshop' are added to images_manifest.py
    { key: 'workshop', label: 'Workshop' },
  ],
};
