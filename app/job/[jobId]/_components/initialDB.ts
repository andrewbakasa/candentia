
import { PrismaClient } from '@prisma/client';

interface Job {
  title: string;
  location: string;
  type: string;
  department: string;
  shortDescription: string;
  fullDescription: string;
  slug: string;
}

const initialJobs: Job[] = [
  {
    title: 'Senior Software Engineer',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Engineering',
    shortDescription: 'Lead the development of scalable software solutions within our agile engineering team.',
    slug: 'senior-software-engineer',
    fullDescription: `
      <p>We are seeking a highly motivated and experienced Senior Software Engineer to join our growing engineering team in Harare. You will be responsible for designing, developing, and maintaining robust and scalable software applications. This role requires strong technical leadership, problem-solving skills, and the ability to collaborate effectively with cross-functional teams.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Design, develop, and implement high-quality software solutions using relevant technologies (e.g., Node.js, Python, Java, etc.).</li>
        <li>Lead and mentor junior engineers, providing technical guidance and fostering best practices.</li>
        <li>Participate in the entire software development lifecycle, from requirements gathering to deployment and maintenance.</li>
        <li>Collaborate with product managers, designers, and other stakeholders to define and deliver innovative features.</li>
        <li>Write clean, well-documented, and testable code.</li>
        <li>Troubleshoot and resolve complex technical issues.</li>
        <li>Contribute to the improvement of our development processes and tools.</li>
        <li>Stay up-to-date with the latest industry trends and technologies.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Computer Science or a related field.</li>
        <li>5+ years of professional software development experience.</li>
        <li>Strong proficiency in at least one major programming language (e.g., Node.js, Python, Java).</li>
        <li>Experience with agile development methodologies.</li>
        <li>Solid understanding of software design principles and patterns.</li>
        <li>Experience with database systems (e.g., PostgreSQL, MongoDB, MySQL).</li>
        <li>Excellent problem-solving and communication skills.</li>
        <li>Ability to work independently and as part of a team.</li>
      </ul>
      <p>We offer a competitive salary, comprehensive benefits, and a dynamic work environment where you can make a real impact. Join us in building the future of software!</p>
    `,
  },
  {
    title: 'Marketing Manager',
    location: 'Remote',
    type: 'Full-time',
    department: 'Marketing',
    shortDescription: 'Develop and execute comprehensive marketing strategies to drive brand awareness and growth globally.',
    slug: 'marketing-manager',
    fullDescription: `
      <p>We are looking for a dynamic and results-oriented Marketing Manager to lead our global marketing efforts. As a key member of the marketing team, you will be responsible for developing and implementing strategic marketing plans that drive brand awareness, customer acquisition, and revenue growth. This is a remote position offering the opportunity to work with a talented international team.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Develop and execute comprehensive marketing strategies across various channels, including digital, content, social media, email, and PR.</li>
        <li>Lead the creation of compelling marketing content that resonates with our target audience.</li>
        <li>Manage and optimize our digital marketing campaigns, including SEO/SEM, social media advertising, and content distribution.</li>
        <li>Track and analyze marketing campaign performance, providing regular reports and insights to optimize ROI.</li>
        <li>Collaborate with sales, product, and customer success teams to ensure alignment of marketing efforts with overall business goals.</li>
        <li>Manage the marketing budget and allocate resources effectively.</li>
        <li>Stay informed about industry trends, competitor activities, and emerging marketing technologies.</li>
        <li>Build and maintain strong relationships with external agencies and partners.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Marketing, Business Administration, or a related field.</li>
        <li>5+ years of experience in marketing, with a proven track record of developing and executing successful marketing strategies.</li>
        <li>Strong understanding of digital marketing principles and best practices.</li>
        <li>Excellent written and verbal communication skills.</li>
        <li>Analytical and data-driven with the ability to interpret marketing metrics and draw actionable insights.</li>
        <li>Experience with marketing automation tools and CRM systems.</li>
        <li>Ability to work independently and manage multiple projects simultaneously.</li>
        <li>Experience working in a remote environment is a plus.</li>
      </ul>
      <p>We offer a competitive salary, flexible work arrangements, and the opportunity to contribute to a rapidly growing global company. If you are a strategic thinker with a passion for marketing, we encourage you to apply!</p>
    `,
  },
  {
    title: 'Customer Support Specialist',
    location: 'Bulawayo, Zimbabwe',
    type: 'Part-time',
    department: 'Customer Success',
    shortDescription: 'Provide exceptional technical and product support to our valued customers in Bulawayo.',
    slug: 'customer-support-specialist',
    fullDescription: `
      <p>We are seeking a friendly and dedicated Customer Support Specialist to join our Customer Success team in Bulawayo. In this part-time role, you will be the first point of contact for our customers, providing timely and effective technical and product support. Your excellent communication and problem-solving skills will be crucial in ensuring customer satisfaction and loyalty.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Respond to customer inquiries via phone, email, and chat in a professional and timely manner.</li>
        <li>Diagnose and resolve technical and product-related issues, providing clear and concise instructions.</li>
        <li>Document customer interactions and solutions accurately in our support system.</li>
        <li>Escalate complex issues to the appropriate technical teams.</li>
        <li>Educate customers on product features and best practices.</li>
        <li>Gather customer feedback and relay it to the product and development teams.</li>
        <li>Contribute to the creation of knowledge base articles and support documentation.</li>
        <li>Maintain a positive and empathetic attitude towards customers at all times.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>High school diploma or equivalent; a technical certification or degree is a plus.</li>
        <li>2+ years of experience in a customer support role, preferably in a technical or software-related industry.</li>
        <li>Excellent verbal and written communication skills in English and potentially local languages.</li>
        <li>Strong problem-solving and troubleshooting abilities.</li>
        <li>Proficiency in using support ticketing systems and knowledge bases.</li>
        <li>Ability to remain calm and professional under pressure.</li>
        <li>A genuine passion for helping customers and ensuring their success.</li>
        <li>Must be based in or around Bulawayo, Zimbabwe.</li>
      </ul>
      <p>This is a part-time position with flexible hours. We offer a supportive work environment and the opportunity to grow your customer support skills. If you are a customer-focused individual with a knack for problem-solving, we encourage you to apply!</p>
    `,
  },
  {
    title: 'Product Designer',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Product',
    shortDescription: 'Create intuitive, user-centered designs for our digital products, collaborating closely with engineering and product teams in Harare.',
    slug: 'product-designer',
    fullDescription: `
      <p>We are looking for a talented and passionate Product Designer to join our dynamic product team in Harare. You will play a key role in shaping the user experience of our digital products, ensuring they are both functional and delightful to use. You will collaborate closely with product managers, engineers, and researchers throughout the design process.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Lead the end-to-end design process, from user research and ideation to wireframing, prototyping, and visual design.</li>
        <li>Conduct user research and usability testing to gather insights and validate design decisions.</li>
        <li>Create user flows, wireframes, and high-fidelity mockups using industry-standard design tools (e.g., Figma, Sketch, Adobe XD).</li>
        <li>Develop and maintain design systems and UI guidelines.</li>
        <li>Collaborate closely with engineers to ensure the feasibility and quality of design implementation.</li>
        <li>Present and articulate design concepts and rationale to stakeholders.</li>
        <li>Iterate on designs based on user feedback and data analysis.</li>
        <li>Stay up-to-date with the latest design trends and best practices.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Design, Human-Computer Interaction (HCI), or a related field.</li>
        <li>3+ years of professional experience in product design or UX/UI design.</li>
        <li>A strong portfolio showcasing user-centered design solutions for web and mobile applications.</li>
        <li>Proficiency in industry-standard design and prototyping tools (e.g., Figma, Sketch, Adobe XD, InVision).</li>
        <li>Solid understanding of user research methodologies and usability principles.</li>
        <li>Excellent visual design skills, including typography, color theory, and layout.</li>
        <li>Strong communication and collaboration skills.</li>
        <li>Experience working in an agile development environment.</li>
        <li>Must be based in or willing to relocate to Harare, Zimbabwe.</li>
      </ul>
      <p>We offer a creative and collaborative work environment where your design contributions will have a significant impact. Join us in crafting exceptional user experiences!</p>
    `,
  },
  {
    title: 'BI Analyst',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Analytics',
    shortDescription: 'Analyze complex datasets to provide actionable insights and support data-driven decision-making across the organization in Harare.',
    slug: 'bi-analyst',
    fullDescription: `
      <p>We are seeking a skilled and detail-oriented BI Analyst to join our growing Analytics team in Harare. You will be responsible for analyzing large datasets, identifying key trends, and providing actionable insights to support strategic and operational decision-making across various departments. Your ability to translate data into clear and compelling narratives will be crucial to our success.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Collect, clean, and analyze data from various sources (databases, spreadsheets, APIs).</li>
        <li>Develop and maintain data models, dashboards, and reports using BI tools (e.g., Tableau, Power BI, Looker).</li>
        <li>Identify key performance indicators (KPIs) and develop metrics to track business performance.</li>
        <li>Conduct ad-hoc analysis to answer business questions and provide data-driven insights.</li>
        <li>Collaborate with stakeholders across different departments to understand their data needs and deliver relevant analysis.</li>
        <li>Present findings and recommendations in a clear and concise manner to both technical and non-technical audiences.</li>
        <li>Ensure data accuracy and integrity.</li>
        <li>Contribute to the development and improvement of our data infrastructure and analytics processes.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Statistics, Mathematics, Computer Science, Economics, or a related quantitative field.</li>
        <li>3+ years of experience as a BI Analyst or Data Analyst.</li>
        <li>Strong proficiency in SQL and experience working with relational databases.</li>
        <li>Hands-on experience with at least one major BI and data visualization tool (e.g., Tableau, Power BI, Looker).</li>
        <li>Excellent analytical and problem-solving skills.</li>
        <li>Strong data wrangling and data cleaning abilities.</li>
        <li>Excellent communication and presentation skills, with the ability to explain complex data insights clearly.</li>
        <li>Experience with data warehousing concepts is a plus.</li>
        <li>Must be based in or willing to relocate to Harare, Zimbabwe.</li>
      </ul>
      <p>We offer a challenging and rewarding work environment where you will have the opportunity to make a significant impact through data-driven insights. Join our analytics team and help us unlock the power of our data!</p>
    `,
  },
  {
    title: 'CAD Engineer',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Engineering',
    shortDescription: 'Advanced CAD Engineer proficient in SolidWorks, simulation, design, and manufacturing of diesel engine components.',
    slug: 'cad-engineer-diesel-engine-components',
    fullDescription: `
      <p>We are seeking a highly skilled and experienced CAD Engineer with a strong background in diesel engine components to join our Engineering team in Harare. You will be responsible for the advanced design, simulation, development, and manufacturing support of various mechanical and potentially some electrical components for our diesel engine product line. Your expertise in SolidWorks and your comprehensive engineering knowledge will be crucial to this role.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Develop detailed 3D models and 2D manufacturing drawings of diesel engine components using SolidWorks (advanced proficiency required).</li>
        <li>Perform advanced simulations (e.g., FEA, CFD) to analyze the structural integrity, thermal performance, and fluid dynamics of components.</li>
        <li>Develop new component designs and improve existing designs for performance, reliability, and manufacturability.</li>
        <li>Collaborate closely with manufacturing teams to ensure designs are optimized for efficient and cost-effective production.</li>
        <li>Interpret complex engineering drawings and specifications, ensuring adherence to standards and tolerances.</li>
        <li>Utilize Blender for visualization and potentially basic modeling tasks.</li>
        <li>Apply fundamental engineering principles related to mechanical components, including bolts, nuts, pumps, valves, heat exchangers, and diesel engine-specific parts (e.g., pistons, cylinders, crankshafts, fuel injection systems).</li>
        <li>Integrate basic knowledge of electrical components relevant to diesel engines (e.g., sensors, wiring harnesses, actuators) into designs.</li>
        <li>Develop and maintain Bills of Materials (BOMs) and other engineering documentation.</li>
        <li>Participate in design reviews and provide technical expertise.</li>
        <li>Troubleshoot design and manufacturing issues related to components.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Mechanical Engineering, Automotive Engineering, or a related field.</li>
        <li>5+ years of professional experience as a CAD Engineer, with a strong focus on mechanical design.</li>
        <li>**Advanced proficiency in SolidWorks is mandatory**, including complex part and assembly modeling, surfacing, and drawing creation.</li>
        <li>Proven experience in performing and interpreting engineering simulations (FEA, CFD).</li>
        <li>Solid understanding of manufacturing processes (e.g., machining, casting, forging).</li>
        <li>Ability to accurately interpret and create detailed engineering drawings according to relevant standards.</li>
        <li>Basic working knowledge of Blender for visualization purposes.</li>
        <li>Strong foundational engineering knowledge of mechanical components relevant to diesel engines (e.g., materials science, stress analysis, thermodynamics).</li>
        <li>Basic understanding of electrical components commonly found in diesel engines and their integration.</li>
        <li>Excellent problem-solving, analytical, and communication skills.</li>
        <li>Ability to work independently and as part of a multidisciplinary team.</li>
        <li>Must be based in or willing to relocate to Harare, Zimbabwe.</li>
      </ul>
      <p>We offer a challenging and rewarding opportunity to contribute to the design and development of critical diesel engine components. You will work with a talented team and have access to advanced design and simulation tools. If you have the advanced SolidWorks skills and a passion for mechanical engineering, particularly in the diesel engine domain, we encourage you to apply!</p>
    `,
  },
  {
    title: 'AI Technologist',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Research & Development',
    shortDescription: 'Drive innovation by researching, developing, and implementing cutting-edge Artificial Intelligence technologies.',
    slug: 'ai-technologist',
    fullDescription: `
      <p>We are seeking a passionate and innovative AI Technologist to join our Research & Development team in Harare. You will be at the forefront of exploring, developing, and implementing advanced Artificial Intelligence solutions to solve complex business challenges and create new opportunities. This role requires a strong understanding of AI principles, hands-on coding skills, and a drive to stay ahead of the curve.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Research and evaluate emerging AI technologies, including machine learning, deep learning, natural language processing, and computer vision.</li>
        <li>Design, develop, and implement AI models and algorithms using relevant programming languages (e.g., Python) and frameworks (e.g., TensorFlow, PyTorch).</li>
        <li>Build and maintain AI infrastructure and pipelines for data ingestion, model training, and deployment.</li>
        <li>Collaborate with cross-functional teams to identify AI use cases and integrate AI solutions into existing products and services.</li>
        <li>Experiment with different AI approaches and evaluate their performance.</li>
        <li>Document AI models, algorithms, and development processes.</li>
        <li>Stay up-to-date with the latest advancements in AI research and industry trends.</li>
        <li>Contribute to the development of our AI strategy and roadmap.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Master's or PhD degree in Computer Science, Artificial Intelligence, Machine Learning, or a related field.</li>
        <li>3+ years of hands-on experience in developing and deploying AI models.</li>
        <li>Strong programming skills in Python.</li>
        <li>Proficiency in deep learning frameworks such as TensorFlow or PyTorch.</li>
        <li>Solid understanding of machine learning algorithms and statistical modeling.</li>
        <li>Experience with cloud computing platforms (e.g., AWS, Azure, GCP) for AI development and deployment.</li>
        <li>Excellent problem-solving, analytical, and critical thinking skills.</li>
        <li>Strong communication and presentation skills to explain complex AI concepts.</li>
        <li>A passion for AI and a drive to learn and experiment with new technologies.</li>
        <li>Must be based in or willing to relocate to Harare, Zimbabwe.</li>
      </ul>
      <p>Join our dynamic R&D team and play a key role in shaping the future of our products through the power of Artificial Intelligence. We offer a stimulating environment, opportunities for continuous learning, and the chance to work on impactful projects.</p>
    `,
  },
  {
    title: 'Data Scientist',
    location: 'Remote',
    type: 'Full-time',
    department: 'Analytics',
    shortDescription: 'Uncover valuable insights from large datasets using advanced statistical and machine learning techniques to drive business strategy.',
    slug: 'data-scientist',
    fullDescription: `
      <p>We are seeking a highly analytical and results-oriented Data Scientist to join our growing Analytics team. You will be responsible for extracting meaningful insights from complex datasets, developing predictive models, and providing data-driven recommendations to support our business objectives. This role requires a strong foundation in statistics, machine learning, and data manipulation techniques.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Collect, clean, and preprocess large and complex datasets from various sources.</li>
        <li>Apply advanced statistical techniques and machine learning algorithms to identify patterns, trends, and insights.</li>
        <li>Develop and evaluate predictive models for forecasting, classification, and optimization.</li>
        <li>Communicate findings and recommendations to stakeholders through clear visualizations and presentations.</li>
        <li>Collaborate with engineering teams to deploy and monitor models in production.</li>
        <li>Stay up-to-date with the latest advancements in data science and machine learning.</li>
        <li>Contribute to the development of our data science infrastructure and best practices.</li>
        <li>Work closely with business teams to understand their needs and translate them into analytical projects.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Master's or PhD degree in Data Science, Statistics, Mathematics, Computer Science, or a related quantitative field.</li>
        <li>3+ years of professional experience as a Data Scientist.</li>
        <li>Strong programming skills in Python and experience with relevant libraries (e.g., Pandas, NumPy, Scikit-learn).</li>
        <li>Proficiency in statistical modeling and machine learning techniques (e.g., regression, classification, clustering, deep learning).</li>
        <li>Experience with data visualization tools (e.g., Tableau, Power BI, Matplotlib, Seaborn).</li>
        <li>Strong SQL skills and experience working with databases.</li>
        <li>Excellent analytical, problem-solving, and critical thinking skills.</li>
        <li>Strong communication and presentation skills.</li>
        <li>Experience with cloud computing platforms (e.g., AWS, Azure, GCP) for data science workflows is a plus.</li>
        <li>Remote work experience is preferred.</li>
      </ul>
      <p>Join our collaborative and innovative analytics team and play a key role in driving data-informed decisions across the organization. We offer a stimulating environment and opportunities for professional growth.</p>
    `,
  },
  {
    title: 'IoT Engineer',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Engineering',
    shortDescription: 'Design, develop, and deploy innovative Internet of Things (IoT) solutions and connected devices.',
    slug: 'iot-engineer',
    fullDescription: `
      <p>We are seeking a skilled and enthusiastic IoT Engineer to join our Engineering team in Harare. You will be responsible for the entire lifecycle of our IoT products, from initial concept and design to development, testing, and deployment. This role requires a strong understanding of embedded systems, networking protocols, and cloud platforms.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Design and develop embedded software and firmware for IoT devices.</li>
        <li>Select and integrate sensors, actuators, and communication modules.</li>
        <li>Develop and implement communication protocols (e.g., MQTT, CoAP, HTTP) for data transmission.</li>
        <li>Work with cloud platforms (e.g., AWS IoT, Azure IoT Hub, Google Cloud IoT) for device management and data processing.</li>
        <li>Develop APIs and backend services to support IoT applications.</li>
        <li>Ensure the security and scalability of IoT solutions.</li>
        <li>Troubleshoot and debug hardware and software issues in IoT devices.</li>
        <li>Collaborate with hardware engineers, data scientists, and other stakeholders.</li>
        <li>Stay up-to-date with the latest trends and technologies in the IoT space.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Electrical Engineering, Computer Engineering, or a related field.</li>
        <li>3+ years of professional experience in IoT development.</li>
        <li>Strong programming skills in languages such as C/C++, Python, or Java.</li>
        <li>Experience with embedded systems and microcontrollers (e.g., Arduino, Raspberry Pi, ESP32).</li>
        <li>Understanding of networking protocols (TCP/IP, Wi-Fi, Bluetooth, LoRaWAN).</li>
        <li>Experience with cloud IoT platforms (e.g., AWS IoT Core, Azure IoT Hub, Google Cloud IoT Platform).</li>
        <li>Knowledge of data security and privacy principles in IoT.</li>
        <li>Excellent problem-solving and debugging skills.</li>
        <li>Strong communication and collaboration skills.</li>
        <li>Must be based in or willing to relocate to Harare, Zimbabwe.</li>
      </ul>
      <p>Join our innovative IoT team and contribute to the development of cutting-edge connected devices and solutions. We offer a stimulating environment and opportunities to work with the latest IoT technologies.</p>
    `,
  },
  {
    title: 'Designer (Graphic & 3D with Blender)',
    location: 'Harare, Zimbabwe',
    type: 'Full-time',
    department: 'Marketing & Product',
    shortDescription: 'Create compelling visual assets, including graphic designs and 3D models using Blender, for marketing and product purposes.',
    slug: 'designer-graphic-3d-blender',
    fullDescription: `
      <p>We are seeking a creative and versatile Designer with expertise in both graphic design and 3D modeling using Blender to join our Marketing & Product team in Harare. You will be responsible for creating visually appealing assets for our marketing campaigns, website, product visualizations, and other communication materials. Your ability to translate ideas into compelling visuals in both 2D and 3D will be highly valued.</p>
      <h3>Responsibilities:</h3>
      <ul>
        <li>Develop engaging graphic designs for web, social media, print, and other marketing channels (e.g., logos, banners, infographics, presentations).</li>
        <li>Create high-quality 3D models, renders, and animations of products and concepts using Blender.</li>
        <li>Collaborate with marketing managers, product managers, and other stakeholders to understand design requirements.</li>
        <li>Develop and maintain brand guidelines and ensure visual consistency across all materials.</li>
        <li>Present design concepts and iterate based on feedback.</li>
        <li>Manage multiple design projects simultaneously and meet deadlines.</li>
        <li>Stay up-to-date with the latest design trends and software advancements.</li>
        <li>Potentially contribute to basic video editing and motion graphics.</li>
      </ul>
      <h3>Qualifications:</h3>
      <ul>
        <li>Bachelor's degree in Graphic Design, Visual Communication, Multimedia Design, or a related field.</li>
        <li>3+ years of professional experience in graphic design.</li>
        <li>Strong portfolio showcasing a range of graphic design projects.</li>
        <li>**Proven proficiency in Blender for 3D modeling, rendering, and animation.**</li>
        <li>Excellent understanding of design principles (typography, color theory, layout, composition).</li>
        <li>Proficiency in industry-standard graphic design software (e.g., Adobe Photoshop, Illustrator, InDesign).</li>
        <li>Strong communication and collaboration skills.</li>
        <li>Ability to work independently and manage time effectively.</li>
        <li>A keen eye for detail and a passion for creating visually appealing and effective designs.</li>
        <li>Must be based in or willing to relocate to Harare, Zimbabwe.</li>
      </ul>
      <p>Join our creative and collaborative team and bring your visual storytelling skills to life! We offer a dynamic environment where you can contribute to both our brand identity and product presentation.</p>
    `,
  },
];

const prisma = new PrismaClient();

export async function saveInitialJobs() {
  try {
    const deleteResult = await prisma.career.deleteMany({});
    console.log(`Successfully deleted ${deleteResult.count} existing career records.`);

    const createManyResult = await prisma.career.createMany({
      data: initialJobs,
    });

    console.log(`Successfully created ${createManyResult.count} initial job records.`);
  } catch (error) {
    console.error('Error saving initial jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}


//saveInitialJobs();
