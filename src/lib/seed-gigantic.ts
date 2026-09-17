import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Massive structured taxonomy covering a vast array of human knowledge
const taxonomy: any = {
  "Natural Sciences": {
    "Physics": {
      "Classical Mechanics": { "Kinematics": true, "Dynamics": true, "Statics": true, "Fluid Mechanics": true },
      "Electromagnetism": { "Electrostatics": true, "Magnetostatics": true, "Electrodynamics": true, "Optics": true },
      "Thermodynamics": { "Laws of Thermodynamics": true, "Statistical Mechanics": true, "Heat Transfer": true },
      "Quantum Mechanics": { "Wave Mechanics": true, "Matrix Mechanics": true, "Quantum Field Theory": true, "String Theory": true },
      "Relativity": { "Special Relativity": true, "General Relativity": true },
      "Astrophysics": { "Stellar Evolution": true, "Cosmology": true, "Black Holes": true, "Exoplanets": true }
    },
    "Chemistry": {
      "Organic Chemistry": { "Alkanes": true, "Alkenes": true, "Aromatics": true, "Stereochemistry": true, "Polymers": true },
      "Inorganic Chemistry": { "Transition Metals": true, "Coordination Chemistry": true, "Organometallics": true, "Solid State": true },
      "Physical Chemistry": { "Chemical Kinetics": true, "Quantum Chemistry": true, "Spectroscopy": true, "Electrochemistry": true },
      "Biochemistry": { "Enzymology": true, "Metabolism": true, "Nucleic Acids": true, "Proteins": true, "Lipids": true },
      "Analytical Chemistry": { "Chromatography": true, "Mass Spectrometry": true, "Titration": true }
    },
    "Biology": {
      "Cell Biology": { "Organelles": true, "Cell Cycle": true, "Cell Signaling": true, "Membrane Transport": true },
      "Genetics": { "Mendelian Genetics": true, "Molecular Genetics": true, "Population Genetics": true, "Epigenetics": true },
      "Evolution": { "Natural Selection": true, "Speciation": true, "Phylogenetics": true, "Paleontology": true },
      "Ecology": { "Ecosystems": true, "Population Dynamics": true, "Conservation Biology": true, "Biomes": true },
      "Physiology": { "Neurobiology": true, "Endocrinology": true, "Cardiovascular System": true, "Immunology": true },
      "Microbiology": { "Bacteriology": true, "Virology": true, "Mycology": true, "Parasitology": true }
    },
    "Earth Sciences": {
      "Geology": { "Plate Tectonics": true, "Mineralogy": true, "Petrology": true, "Seismology": true },
      "Meteorology": { "Atmospheric Dynamics": true, "Climatology": true, "Weather Forecasting": true },
      "Oceanography": { "Physical Oceanography": true, "Chemical Oceanography": true, "Marine Biology": true }
    }
  },
  "Formal Sciences": {
    "Mathematics": {
      "Algebra": { "Linear Algebra": true, "Abstract Algebra": true, "Boolean Algebra": true },
      "Calculus": { "Differential Calculus": true, "Integral Calculus": true, "Multivariable Calculus": true, "Differential Equations": true },
      "Geometry": { "Euclidean Geometry": true, "Non-Euclidean Geometry": true, "Topology": true, "Differential Geometry": true },
      "Number Theory": { "Prime Numbers": true, "Cryptography": true, "Diophantine Equations": true },
      "Statistics": { "Probability Theory": true, "Inferential Statistics": true, "Bayesian Statistics": true, "Stochastic Processes": true }
    },
    "Computer Science": {
      "Algorithms": { "Sorting Algorithms": true, "Graph Algorithms": true, "Dynamic Programming": true, "Complexity Theory": true },
      "Data Structures": { "Trees": true, "Graphs": true, "Hash Tables": true, "Linked Lists": true },
      "Artificial Intelligence": { "Machine Learning": true, "Deep Learning": true, "Natural Language Processing": true, "Computer Vision": true },
      "Systems": { "Operating Systems": true, "Databases": true, "Computer Networks": true, "Distributed Systems": true },
      "Software Engineering": { "Design Patterns": true, "Agile Methodologies": true, "Software Testing": true, "System Architecture": true },
      "Cybersecurity": { "Cryptography": true, "Network Security": true, "Ethical Hacking": true, "Malware Analysis": true }
    },
    "Logic": {
      "Formal Logic": { "Propositional Logic": true, "First-Order Logic": true, "Modal Logic": true },
      "Mathematical Logic": { "Set Theory": true, "Model Theory": true, "Proof Theory": true }
    }
  },
  "Social Sciences": {
    "Economics": {
      "Microeconomics": { "Supply and Demand": true, "Market Structures": true, "Game Theory": true, "Consumer Choice": true },
      "Macroeconomics": { "Monetary Policy": true, "Fiscal Policy": true, "Economic Growth": true, "International Trade": true },
      "Behavioral Economics": { "Heuristics": true, "Nudge Theory": true, "Prospect Theory": true }
    },
    "Psychology": {
      "Cognitive Psychology": { "Memory": true, "Attention": true, "Perception": true, "Problem Solving": true },
      "Clinical Psychology": { "Psychopathology": true, "Psychotherapy": true, "Diagnostic Systems": true },
      "Developmental Psychology": { "Child Development": true, "Adolescence": true, "Aging": true },
      "Social Psychology": { "Group Dynamics": true, "Attitudes": true, "Interpersonal Relations": true }
    },
    "Sociology": {
      "Social Theory": { "Functionalism": true, "Conflict Theory": true, "Symbolic Interactionism": true },
      "Social Stratification": { "Social Class": true, "Social Mobility": true, "Inequality": true },
      "Demography": { "Population Growth": true, "Migration": true, "Urbanization": true }
    },
    "Political Science": {
      "Political Theory": { "Classical Political Philosophy": true, "Modern Political Thought": true },
      "Comparative Politics": { "Democratization": true, "Authoritarianism": true, "Electoral Systems": true },
      "International Relations": { "Realism": true, "Liberalism": true, "Constructivism": true, "Geopolitics": true }
    }
  },
  "Humanities": {
    "History": {
      "Ancient History": { "Ancient Egypt": true, "Mesopotamia": true, "Ancient Greece": true, "Roman Empire": true },
      "Medieval History": { "Feudalism": true, "Crusades": true, "Byzantine Empire": true },
      "Modern History": { "Renaissance": true, "Industrial Revolution": true, "World War I": true, "World War II": true, "Cold War": true }
    },
    "Philosophy": {
      "Metaphysics": { "Ontology": true, "Philosophy of Time": true, "Philosophy of Mind": true },
      "Epistemology": { "Rationalism": true, "Empiricism": true, "Skepticism": true },
      "Ethics": { "Utilitarianism": true, "Deontology": true, "Virtue Ethics": true, "Bioethics": true },
      "Aesthetics": { "Philosophy of Art": true, "Concepts of Beauty": true }
    },
    "Literature": {
      "Classical Literature": { "Greek Tragedy": true, "Roman Poetry": true },
      "English Literature": { "Shakespearean Drama": true, "Victorian Novel": true, "Romantic Poetry": true },
      "World Literature": { "Russian Literature": true, "Latin American Boom": true, "Postcolonial Literature": true }
    },
    "Linguistics": {
      "Theoretical Linguistics": { "Phonetics": true, "Phonology": true, "Syntax": true, "Semantics": true, "Pragmatics": true },
      "Applied Linguistics": { "Sociolinguistics": true, "Psycholinguistics": true, "Historical Linguistics": true }
    }
  },
  "Applied Sciences & Engineering": {
    "Medicine": {
      "Anatomy": { "Skeletal System": true, "Nervous System": true, "Cardiovascular System": true },
      "Pathology": { "Cellular Pathology": true, "Immunopathology": true, "Oncology": true },
      "Pharmacology": { "Pharmacokinetics": true, "Pharmacodynamics": true, "Toxicology": true }
    },
    "Mechanical Engineering": {
      "Solid Mechanics": { "Statics": true, "Dynamics": true, "Mechanics of Materials": true },
      "Thermal Sciences": { "Thermodynamics": true, "Heat Transfer": true, "Energy Conversion": true },
      "Robotics": { "Kinematics": true, "Control Systems": true, "Sensors and Actuators": true }
    },
    "Electrical Engineering": {
      "Circuits": { "Analog Circuits": true, "Digital Circuits": true, "Microcontrollers": true },
      "Signal Processing": { "Digital Signal Processing": true, "Image Processing": true },
      "Power Systems": { "Power Generation": true, "Transmission Lines": true, "Renewable Energy Systems": true }
    },
    "Civil Engineering": {
      "Structural Engineering": { "Structural Analysis": true, "Concrete Design": true, "Steel Design": true },
      "Geotechnical Engineering": { "Soil Mechanics": true, "Foundation Engineering": true },
      "Environmental Engineering": { "Water Treatment": true, "Waste Management": true, "Air Pollution Control": true }
    },
    "Aerospace Engineering": {
      "Aerodynamics": { "Incompressible Flow": true, "Compressible Flow": true },
      "Propulsion": { "Jet Engines": true, "Rocket Propulsion": true },
      "Astrodynamics": { "Orbital Mechanics": true, "Spacecraft Dynamics": true }
    }
  },
  "Arts & Design": {
    "Visual Arts": {
      "Painting": { "Oil Painting": true, "Watercolor": true, "Acrylics": true },
      "Sculpture": { "Stone Carving": true, "Metal Casting": true, "Clay Modeling": true },
      "Photography": { "Digital Photography": true, "Film Photography": true, "Photojournalism": true }
    },
    "Performing Arts": {
      "Music": { "Music Theory": true, "Composition": true, "Ethnomusicology": true, "Vocal Performance": true },
      "Theater": { "Acting": true, "Directing": true, "Stage Design": true, "Playwriting": true },
      "Dance": { "Ballet": true, "Contemporary Dance": true, "Choreography": true }
    },
    "Design": {
      "Graphic Design": { "Typography": true, "Branding": true, "UI/UX Design": true },
      "Industrial Design": { "Product Design": true, "Ergonomics": true },
      "Architecture": { "Architectural History": true, "Urban Planning": true, "Sustainable Architecture": true }
    }
  },
  "Business & Management": {
    "Finance": {
      "Corporate Finance": { "Capital Budgeting": true, "Risk Management": true, "Valuation": true },
      "Investments": { "Portfolio Theory": true, "Derivatives": true, "Fixed Income": true }
    },
    "Marketing": {
      "Digital Marketing": { "SEO": true, "Content Marketing": true, "Social Media Strategy": true },
      "Consumer Behavior": { "Market Research": true, "Brand Loyalty": true }
    },
    "Management": {
      "Strategic Management": { "Competitive Analysis": true, "Corporate Strategy": true },
      "Human Resources": { "Organizational Behavior": true, "Talent Acquisition": true, "Performance Management": true }
    },
    "Accounting": {
      "Financial Accounting": { "Balance Sheets": true, "Income Statements": true },
      "Managerial Accounting": { "Cost Analysis": true, "Budgeting": true }
    }
  },
  "Law & Jurisprudence": {
    "Public Law": {
      "Constitutional Law": { "Civil Rights": true, "Separation of Powers": true },
      "Criminal Law": { "Homicide": true, "Theft": true, "Criminal Procedure": true },
      "Administrative Law": { "Regulatory Agencies": true, "Rulemaking": true }
    },
    "Private Law": {
      "Contract Law": { "Offer and Acceptance": true, "Breach of Contract": true },
      "Tort Law": { "Negligence": true, "Defamation": true, "Strict Liability": true },
      "Property Law": { "Real Estate": true, "Intellectual Property": true }
    },
    "International Law": {
      "Public International Law": { "Treaties": true, "Human Rights Law": true, "Law of the Sea": true },
      "International Trade Law": { "WTO Rules": true, "Tariffs": true }
    }
  }
};

async function traverseAndSeed(obj: any, parentId: string | null, tier: number) {
  for (const [key, value] of Object.entries(obj)) {
    const id = `NODE_${key.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const isAtomic = value === true;
    
    await prisma.knowledgeNode.create({
      data: {
        id,
        label: key,
        tier,
        description: isAtomic ? `Advanced quiz on ${key}` : `Explore ${key}`,
        isAtomic,
        parentDomainId: parentId
      }
    });

    if (!isAtomic) {
      await traverseAndSeed(value, id, tier + 1);
    }
  }
}

export async function seedMassiveTree() {
  console.log('Clearing existing nodes for massive seeding...');
  await prisma.interactionLog.deleteMany({});
  await prisma.masteryState.deleteMany({});
  await prisma.prerequisite.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.knowledgeNode.deleteMany({});
  
  console.log('Seeding GIGANTIC taxonomy...');
  await traverseAndSeed(taxonomy, null, 0);
  console.log('Gigantic taxonomy seeded successfully!');
}

if (require.main === module) {
  seedMassiveTree()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
