import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const taxonomy: any = {
  "Sciences": {
    "Physics": {
      "Quantum Mechanics": {
        "Wave-Particle Duality": true,
        "Schrödinger Equation": true,
        "Quantum Entanglement": true,
        "Heisenberg Uncertainty Principle": true
      },
      "Thermodynamics": {
        "Laws of Thermodynamics": true,
        "Entropy": true,
        "Enthalpy": true,
        "Carnot Cycle": true
      },
      "Relativity": {
        "Special Relativity": true,
        "General Relativity": true,
        "Time Dilation": true
      }
    },
    "Chemistry": {
      "Inorganic Chemistry": {
        "Coordination Compounds": true,
        "Transition Metals": true,
        "Crystal Field Theory": true
      },
      "Physical Chemistry": {
        "Chemical Kinetics": true,
        "Quantum Chemistry": true,
        "Spectroscopy": true
      },
      "Biochemistry": {
        "Enzyme Kinetics": true,
        "Metabolic Pathways": true,
        "Protein Folding": true
      }
    },
    "Earth Sciences": {
      "Geology": {
        "Plate Tectonics": true,
        "Mineralogy": true,
        "Petrology": true
      },
      "Meteorology": {
        "Atmospheric Thermodynamics": true,
        "Synoptic Meteorology": true,
        "Climatology": true
      },
      "Oceanography": {
        "Physical Oceanography": true,
        "Marine Biology": true,
        "Chemical Oceanography": true
      }
    }
  },
  "Mathematics & Logic": {
    "Pure Mathematics": {
      "Number Theory": {
        "Prime Numbers": true,
        "Modular Arithmetic": true,
        "Cryptography": true
      },
      "Topology": {
        "Point-Set Topology": true,
        "Algebraic Topology": true,
        "Knot Theory": true
      },
      "Abstract Algebra": {
        "Group Theory": true,
        "Ring Theory": true,
        "Field Theory": true
      }
    },
    "Applied Mathematics": {
      "Statistics": {
        "Probability Theory": true,
        "Inferential Statistics": true,
        "Bayesian Statistics": true
      },
      "Calculus": {
        "Differential Equations": true,
        "Vector Calculus": true,
        "Multivariable Calculus": true
      }
    }
  },
  "Engineering & Technology": {
    "Computer Science": {
      "Artificial Intelligence": {
        "Machine Learning": true,
        "Neural Networks": true,
        "Natural Language Processing": true,
        "Reinforcement Learning": true
      },
      "Cybersecurity": {
        "Cryptography": true,
        "Network Security": true,
        "Ethical Hacking": true
      },
      "Software Engineering": {
        "Design Patterns": true,
        "Agile Methodology": true,
        "System Architecture": true
      }
    },
    "Mechanical Engineering": {
      "Fluid Mechanics": {
        "Navier-Stokes Equations": true,
        "Aerodynamics": true,
        "Turbulence": true
      },
      "Materials Science": {
        "Crystallography": true,
        "Polymer Science": true,
        "Metallurgy": true
      }
    }
  },
  "Humanities & Arts": {
    "History": {
      "Ancient History": {
        "Roman Empire": true,
        "Ancient Egypt": true,
        "Mesopotamia": true
      },
      "Modern History": {
        "Industrial Revolution": true,
        "Cold War": true,
        "French Revolution": true
      }
    },
    "Philosophy": {
      "Epistemology": {
        "Rationalism": true,
        "Empiricism": true,
        "Constructivism": true
      },
      "Metaphysics": {
        "Ontology": true,
        "Philosophy of Mind": true,
        "Determinism vs Free Will": true
      }
    },
    "Literature": {
      "Classical Literature": {
        "Greek Tragedies": true,
        "Homeric Epics": true,
        "Roman Poetry": true
      },
      "Modernist Literature": {
        "Stream of Consciousness": true,
        "Existentialist Literature": true,
        "Surrealism in Literature": true
      }
    },
    "Visual Arts": {
      "Art History": {
        "Renaissance Art": true,
        "Impressionism": true,
        "Cubism": true
      },
      "Techniques": {
        "Oil Painting": true,
        "Sculpting": true,
        "Digital Illustration": true
      }
    }
  },
  "Social Sciences": {
    "Economics": {
      "Macroeconomics": {
        "Monetary Policy": true,
        "Fiscal Policy": true,
        "Economic Growth": true
      },
      "Microeconomics": {
        "Game Theory": true,
        "Market Structures": true,
        "Consumer Choice Theory": true
      }
    },
    "Psychology": {
      "Clinical Psychology": {
        "Cognitive Behavioral Therapy": true,
        "Psychoanalysis": true,
        "Abnormal Psychology": true
      },
      "Developmental Psychology": {
        "Piaget's Stages": true,
        "Attachment Theory": true,
        "Erikson's Psychosocial Stages": true
      }
    },
    "Sociology": {
      "Social Stratification": {
        "Class Systems": true,
        "Social Mobility": true,
        "Inequality": true
      },
      "Criminology": {
        "Deviance": true,
        "Criminal Justice System": true,
        "Penology": true
      }
    }
  },
  "Language & Linguistics": {
    "Theoretical Linguistics": {
      "Syntax": {
        "Generative Grammar": true,
        "Phrase Structure": true,
        "Dependency Grammar": true
      },
      "Semantics": {
        "Lexical Semantics": true,
        "Formal Semantics": true,
        "Pragmatics": true
      }
    },
    "Applied Linguistics": {
      "Sociolinguistics": {
        "Dialectology": true,
        "Language Variation": true,
        "Code-Switching": true
      },
      "Psycholinguistics": {
        "Language Acquisition": true,
        "Language Processing": true,
        "Neurolinguistics": true
      }
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
  
  console.log('Seeding VAST taxonomy...');
  await traverseAndSeed(taxonomy, null, 0);
  console.log('Vast taxonomy seeded successfully!');
}

if (require.main === module) {
  seedMassiveTree()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
