import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('Seeding CogniTrace AI database with Deep Branching Tree...');

  // 1. Create Knowledge Nodes (Macro + Atomic)
  const nodes = [
    // --- MATHEMATICS BRANCH ---
    { id: 'MACRO_MATH', label: 'Mathematics', tier: 0, description: 'Abstract science of numbers, quantity, and space.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_ARITHMETIC', label: 'Arithmetic', tier: 1, description: 'Basic operations on numbers.', isAtomic: false, parentDomainId: 'MACRO_MATH' },
    { id: 'MACRO_FRACTIONS', label: 'Fractions', tier: 2, description: 'Numerical quantities that are not whole numbers.', isAtomic: false, parentDomainId: 'MACRO_ARITHMETIC' },
    { id: 'NODE_INT', label: 'Integer Magnitude & Operations', tier: 3, description: 'Understanding whole numbers.', isAtomic: true, parentDomainId: 'MACRO_ARITHMETIC' },
    { id: 'NODE_DIV', label: 'Equal Partitioning & Division', tier: 3, description: 'Dividing a whole.', isAtomic: true, parentDomainId: 'MACRO_ARITHMETIC' },
    { id: 'NODE_FRAC_CORE', label: 'Part-Whole Fraction Representation', tier: 4, description: 'Representing fractions.', isAtomic: true, parentDomainId: 'MACRO_FRACTIONS' },
    { id: 'NODE_COMMON_DENOM', label: 'Common Multiples', tier: 5, description: 'Finding common denominators.', isAtomic: true, parentDomainId: 'MACRO_FRACTIONS' },
    { id: 'NODE_FRAC_ADD', label: 'Addition of Unlike Fractions', tier: 6, description: 'Adding fractions with different denominators.', isAtomic: true, parentDomainId: 'MACRO_FRACTIONS' },

    // --- SCIENCE BRANCH ---
    { id: 'MACRO_SCIENCE', label: 'Science', tier: 0, description: 'Systematic enterprise that builds and organizes knowledge.', isAtomic: false, parentDomainId: null },
    
    // Physics
    { id: 'MACRO_PHYSICS', label: 'Physics', tier: 1, description: 'Study of matter and its motion.', isAtomic: false, parentDomainId: 'MACRO_SCIENCE' },
    { id: 'MACRO_MECHANICS', label: 'Classical Mechanics', tier: 2, description: 'Motion of macroscopic objects.', isAtomic: false, parentDomainId: 'MACRO_PHYSICS' },
    { id: 'NODE_KINEMATICS', label: '1D Kinematics', tier: 3, description: 'Motion along a straight line.', isAtomic: true, parentDomainId: 'MACRO_MECHANICS' },
    
    // Biology
    { id: 'MACRO_BIOLOGY', label: 'Biology', tier: 1, description: 'Study of life and living organisms.', isAtomic: false, parentDomainId: 'MACRO_SCIENCE' },
    { id: 'MACRO_CELL_BIO', label: 'Cell Biology', tier: 2, description: 'Study of cell structure and function.', isAtomic: false, parentDomainId: 'MACRO_BIOLOGY' },
    { id: 'NODE_MITOCHONDRIA', label: 'Mitochondria Function', tier: 3, description: 'Powerhouse of the cell.', isAtomic: true, parentDomainId: 'MACRO_CELL_BIO' },

    // Chemistry Deep Branch
    { id: 'MACRO_CHEMISTRY', label: 'Chemistry', tier: 1, description: 'Study of matter, its properties, how and why substances combine or separate.', isAtomic: false, parentDomainId: 'MACRO_SCIENCE' },
    { id: 'MACRO_ORGANIC_CHEM', label: 'Organic Chemistry', tier: 2, description: 'Study of the structure, properties, composition, reactions, and preparation of carbon-containing compounds.', isAtomic: false, parentDomainId: 'MACRO_CHEMISTRY' },
    { id: 'MACRO_STEREOCHEMISTRY', label: 'Stereochemistry', tier: 3, description: 'Study of the relative spatial arrangement of atoms that form the structure of molecules.', isAtomic: false, parentDomainId: 'MACRO_ORGANIC_CHEM' },
    { id: 'MACRO_CHIRALITY', label: 'Chiral Compounds', tier: 4, description: 'Molecules that have a non-superimposable mirror image.', isAtomic: false, parentDomainId: 'MACRO_STEREOCHEMISTRY' },
    { id: 'NODE_ISOMERS', label: 'Enantiomers vs Diastereomers (Isomers)', tier: 5, description: 'Distinguishing between different types of stereoisomers.', isAtomic: true, parentDomainId: 'MACRO_CHIRALITY' },


    // --- HUMANITIES BRANCH ---
    { id: 'MACRO_HUMANITIES', label: 'Humanities', tier: 0, description: 'Academic disciplines that study aspects of human society and culture.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_HISTORY', label: 'History', tier: 1, description: 'Study of the past.', isAtomic: false, parentDomainId: 'MACRO_HUMANITIES' },
    { id: 'MACRO_WW2', label: 'World War II', tier: 2, description: 'Global war that lasted from 1939 to 1945.', isAtomic: false, parentDomainId: 'MACRO_HISTORY' },
    { id: 'NODE_DDAY', label: 'D-Day Invasion', tier: 3, description: 'Normandy landings on Tuesday, 6 June 1944.', isAtomic: true, parentDomainId: 'MACRO_WW2' },

    // --- TECHNOLOGY BRANCH ---
    { id: 'MACRO_TECH', label: 'Technology', tier: 0, description: 'Application of scientific knowledge for practical purposes.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_CS', label: 'Computer Science', tier: 1, description: 'Study of computation, automation, and information.', isAtomic: false, parentDomainId: 'MACRO_TECH' },
    { id: 'MACRO_DATA_STRUCTS', label: 'Data Structures', tier: 2, description: 'Data organization, management, and storage formats.', isAtomic: false, parentDomainId: 'MACRO_CS' },
    { id: 'NODE_ARRAYS', label: 'Arrays vs Linked Lists', tier: 3, description: 'Contiguous vs non-contiguous memory structures.', isAtomic: true, parentDomainId: 'MACRO_DATA_STRUCTS' },

    // --- LANGUAGES BRANCH ---
    { id: 'MACRO_LANGUAGES', label: 'Languages', tier: 0, description: 'Structured system of communication.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_SPANISH', label: 'Spanish', tier: 1, description: 'Romance language of the Indo-European language family.', isAtomic: false, parentDomainId: 'MACRO_LANGUAGES' },
    { id: 'MACRO_ES_GRAMMAR', label: 'Grammar', tier: 2, description: 'Structural rules governing the composition of clauses, phrases, and words.', isAtomic: false, parentDomainId: 'MACRO_SPANISH' },
    { id: 'NODE_AR_VERBS', label: 'Present Tense AR Verbs', tier: 3, description: 'Conjugating regular -ar verbs in the present tense.', isAtomic: true, parentDomainId: 'MACRO_ES_GRAMMAR' },
    
    // --- ARTS & MUSIC BRANCH ---
    { id: 'MACRO_ARTS', label: 'Arts & Humanities', tier: 0, description: 'Creative and cultural disciplines.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_MUSIC', label: 'Music Theory', tier: 1, description: 'Study of the practices and possibilities of music.', isAtomic: false, parentDomainId: 'MACRO_ARTS' },
    { id: 'MACRO_HARMONY', label: 'Harmony', tier: 2, description: 'Simultaneous sounding of musical notes.', isAtomic: false, parentDomainId: 'MACRO_MUSIC' },
    { id: 'NODE_CHORDS', label: 'ii-V-I Chord Progression', tier: 3, description: 'Common jazz progression.', isAtomic: true, parentDomainId: 'MACRO_HARMONY' },

    // --- PHILOSOPHY BRANCH ---
    { id: 'MACRO_PHILOSOPHY', label: 'Philosophy', tier: 1, description: 'Study of general and fundamental questions.', isAtomic: false, parentDomainId: 'MACRO_ARTS' },
    { id: 'MACRO_ETHICS', label: 'Ethics', tier: 2, description: 'Moral principles that govern a person\'s behavior.', isAtomic: false, parentDomainId: 'MACRO_PHILOSOPHY' },
    { id: 'NODE_UTILITARIANISM', label: 'Utilitarianism', tier: 3, description: 'Maximizing well-being for the majority.', isAtomic: true, parentDomainId: 'MACRO_ETHICS' },

    // --- MEDICINE BRANCH ---
    { id: 'MACRO_MEDICINE', label: 'Medicine & Health', tier: 0, description: 'Science of healing.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_ANATOMY', label: 'Anatomy', tier: 1, description: 'Structure of organisms.', isAtomic: false, parentDomainId: 'MACRO_MEDICINE' },
    { id: 'MACRO_NERVOUS', label: 'Nervous System', tier: 2, description: 'Network of nerve cells.', isAtomic: false, parentDomainId: 'MACRO_ANATOMY' },
    { id: 'NODE_SYNAPSES', label: 'Synaptic Transmission', tier: 3, description: 'How neurons communicate.', isAtomic: true, parentDomainId: 'MACRO_NERVOUS' },

    // --- ENGINEERING BRANCH ---
    { id: 'MACRO_ENGINEERING', label: 'Engineering', tier: 0, description: 'Use of scientific principles to design and build machines.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_EE', label: 'Electrical Engineering', tier: 1, description: 'Study of electromagnetism and electronics.', isAtomic: false, parentDomainId: 'MACRO_ENGINEERING' },
    { id: 'MACRO_CIRCUITS', label: 'Circuits', tier: 2, description: 'Closed loops through which electrons can travel.', isAtomic: false, parentDomainId: 'MACRO_EE' },
    { id: 'NODE_OHMS_LAW', label: 'Ohm\'s Law (V=IR)', tier: 3, description: 'Relationship between voltage, current, and resistance.', isAtomic: true, parentDomainId: 'MACRO_CIRCUITS' },

    // --- ASTRONOMY BRANCH ---
    { id: 'MACRO_ASTRONOMY', label: 'Astronomy', tier: 1, description: 'Study of celestial objects.', isAtomic: false, parentDomainId: 'MACRO_SCIENCE' },
    { id: 'MACRO_STELLAR', label: 'Stellar Evolution', tier: 2, description: 'Process by which a star changes over the course of time.', isAtomic: false, parentDomainId: 'MACRO_ASTRONOMY' },
    { id: 'NODE_NEUTRON_STARS', label: 'Neutron Stars', tier: 3, description: 'Collapsed core of a massive supergiant star.', isAtomic: true, parentDomainId: 'MACRO_STELLAR' },

    // --- ECONOMICS BRANCH ---
    { id: 'MACRO_SOCIAL_SCI', label: 'Social Sciences', tier: 0, description: 'Study of societies and relationships among individuals.', isAtomic: false, parentDomainId: null },
    { id: 'MACRO_ECONOMICS', label: 'Economics', tier: 1, description: 'Production, distribution, and consumption of goods.', isAtomic: false, parentDomainId: 'MACRO_SOCIAL_SCI' },
    { id: 'MACRO_MICRO', label: 'Microeconomics', tier: 2, description: 'Behavior of individuals and firms.', isAtomic: false, parentDomainId: 'MACRO_ECONOMICS' },
    { id: 'NODE_SUPPLY_DEMAND', label: 'Supply and Demand', tier: 3, description: 'Economic model of price determination.', isAtomic: true, parentDomainId: 'MACRO_MICRO' },

    // --- LITERATURE BRANCH ---
    { id: 'MACRO_LITERATURE', label: 'Literature', tier: 1, description: 'Written works of superior or lasting artistic merit.', isAtomic: false, parentDomainId: 'MACRO_ARTS' },
    { id: 'MACRO_ENGLISH_LIT', label: 'English Literature', tier: 2, description: 'Literature written in the English language.', isAtomic: false, parentDomainId: 'MACRO_LITERATURE' },
    { id: 'MACRO_SHAKESPEARE', label: 'Shakespeare', tier: 3, description: 'Works of William Shakespeare.', isAtomic: false, parentDomainId: 'MACRO_ENGLISH_LIT' },
    { id: 'NODE_IAMBIC', label: 'Iambic Pentameter', tier: 4, description: 'Metrical line used in traditional English poetry.', isAtomic: true, parentDomainId: 'MACRO_SHAKESPEARE' },

    // --- PSYCHOLOGY BRANCH ---
    { id: 'MACRO_PSYCHOLOGY', label: 'Psychology', tier: 1, description: 'Scientific study of the mind and behavior.', isAtomic: false, parentDomainId: 'MACRO_SOCIAL_SCI' },
    { id: 'MACRO_COGNITIVE_PSYCH', label: 'Cognitive Psychology', tier: 2, description: 'Study of mental processes.', isAtomic: false, parentDomainId: 'MACRO_PSYCHOLOGY' },
    { id: 'NODE_WORKING_MEMORY', label: 'Working Memory', tier: 3, description: 'Cognitive system with a limited capacity.', isAtomic: true, parentDomainId: 'MACRO_COGNITIVE_PSYCH' },
  ];

  for (const node of nodes) {
    await prisma.knowledgeNode.upsert({
      where: { id: node.id },
      update: {
        isAtomic: node.isAtomic,
        parentDomainId: node.parentDomainId,
      },
      create: node,
    });
  }

  // 2. Create Prerequisites
  const prerequisites = [
    // Math
    { sourceId: 'NODE_INT', targetId: 'NODE_DIV' },
    { sourceId: 'NODE_DIV', targetId: 'NODE_FRAC_CORE' },
    { sourceId: 'NODE_FRAC_CORE', targetId: 'NODE_COMMON_DENOM' },
    { sourceId: 'NODE_COMMON_DENOM', targetId: 'NODE_FRAC_ADD' },
  ];

  for (const prereq of prerequisites) {
    await prisma.prerequisite.upsert({
      where: {
        sourceId_targetId: { sourceId: prereq.sourceId, targetId: prereq.targetId },
      },
      update: {},
      create: prereq,
    });
  }

  // NOTE: Problems are no longer seeded because they are GENERATED BY LLM DYNAMICALLY!
  // We will let the LLM generate the quiz questions when hitting an atomic node.
  // We can clear old problems if we want, or leave them as fallback.

  console.log('Deep Branching Tree Database seeded successfully.');
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
