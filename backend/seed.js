

require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

const Hospital = require("./models/Hospital");
const User = require("./models/User");
const Doctor = require("./models/Doctor");

const PASSWORD = "Password@123";

const hospitals = [
  {
    hospitalName: "PulseQ Demo Hospital",
    address: "Bengaluru",
  },
  {
    hospitalName: "City Care Hospital",
    address: "Whitefield, Bengaluru",
  },
  {
    hospitalName: "Apollo Care Center",
    address: "Indiranagar, Bengaluru",
  },
  {
    hospitalName: "MediPlus Hospital",
    address: "Electronic City, Bengaluru",
  },
];

const doctors = [
  {
    name: "Dr Kumar",
    specialization: "General Medicine",
  },
  {
    name: "Dr Ravi",
    specialization: "Cardiology",
  },
  {
    name: "Dr Priya",
    specialization: "Dermatology",
  },
  {
    name: "Dr Anil",
    specialization: "Orthopedics",
  },
  {
    name: "Dr Sneha",
    specialization: "Pediatrics",
  },
];

const createUser = async ({
  email,
  name,
  role,
  hospitalId,
}) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      name,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role,
      hospitalId,
    });

    console.log(`  Created ${role}: ${email}`);
  } else {
    user.hospitalId = hospitalId;
    user.role = role;

    await user.save();

    console.log(`  Updated ${role}: ${email}`);
  }

  return user;
};

const createDoctor = async ({
  hospitalId,
  doctorData,
  doctorNumber,
}) => {
  const email = `doctor${doctorNumber}@${hospitalId}.pulseq.com`;

  const user = await createUser({
    email,
    name: doctorData.name,
    role: "doctor",
    hospitalId,
  });

  let doctor = await Doctor.findOne({
    userId: user._id,
  });

  if (!doctor) {
    doctor = await Doctor.create({
      hospitalId,
      userId: user._id,
      doctorName: doctorData.name,
      specialization: doctorData.specialization,
    });

    console.log(`    Created doctor profile: ${doctorData.name}`);
  }

  return doctor;
};

const createHospitalData = async (hospital, hospitalIndex) => {
  // -----------------------------------------
  // Create / Get Hospital
  // -----------------------------------------

  let hospitalDoc = await Hospital.findOne({
    hospitalName: hospital.hospitalName,
  });

  if (!hospitalDoc) {
    hospitalDoc = await Hospital.create({
      hospitalName: hospital.hospitalName,
      address: hospital.address,
      isActive: true,
    });

    console.log(`\nCreated Hospital: ${hospital.hospitalName}`);
  } else {
    console.log(`\nHospital already exists: ${hospital.hospitalName}`);
  }

  const hospitalId = hospitalDoc._id;

  // -----------------------------------------
  // Create Admin
  // -----------------------------------------

  await createUser({
    email: `admin${hospitalIndex}@pulseq.com`,
    name: `Admin ${hospitalIndex}`,
    role: "admin",
    hospitalId,
  });

  // -----------------------------------------
  // Create Receptionists
  // -----------------------------------------

  await createUser({
    email: `reception${hospitalIndex}a@pulseq.com`,
    name: `Receptionist ${hospitalIndex}A`,
    role: "receptionist",
    hospitalId,
  });

  await createUser({
    email: `reception${hospitalIndex}b@pulseq.com`,
    name: `Receptionist ${hospitalIndex}B`,
    role: "receptionist",
    hospitalId,
  });

  // -----------------------------------------
  // Create Doctors
  // -----------------------------------------

  for (let i = 0; i < doctors.length; i++) {
    await createDoctor({
      hospitalId,
      doctorData: doctors[i],
      doctorNumber: `${hospitalIndex}${i + 1}`,
    });
  }

  return hospitalDoc;
};

const seedDatabase = async () => {
  try {
    // -----------------------------------------
    // Connect Database
    // -----------------------------------------

    await connectDB();

    console.log("\n====================================");
    console.log("       PulseQ Database Seeding");
    console.log("====================================");

    const createdHospitals = [];

    // -----------------------------------------
    // Create Hospitals
    // -----------------------------------------

    for (let i = 0; i < hospitals.length; i++) {
      const hospital = await createHospitalData(
        hospitals[i],
        i + 1
      );

      createdHospitals.push(hospital);
    }

    // -----------------------------------------
    // Summary
    // -----------------------------------------

    console.log("\n====================================");
    console.log("       SEED COMPLETE");
    console.log("====================================");

    console.log("\nHospitals created:");

    createdHospitals.forEach((hospital, index) => {
      console.log(
        `${index + 1}. ${hospital.hospitalName}`
      );

      console.log(
        `   ID: ${hospital._id.toString()}`
      );
    });

    console.log("\n====================================");
    console.log("LOGIN PASSWORD");
    console.log("====================================");

    console.log(`Password for all users: ${PASSWORD}`);

    console.log("\nAdmin accounts:");

    for (let i = 1; i <= hospitals.length; i++) {
      console.log(
        `admin${i}@pulseq.com`
      );
    }

    console.log("\nReceptionist accounts:");

    for (let i = 1; i <= hospitals.length; i++) {
      console.log(
        `reception${i}a@pulseq.com`
      );

      console.log(
        `reception${i}b@pulseq.com`
      );
    }

    console.log("\nDoctor accounts:");

    for (let i = 1; i <= hospitals.length; i++) {
      for (let j = 1; j <= doctors.length; j++) {
        console.log(
          `doctor${i}${j}@${createdHospitals[
            i - 1
          ]._id}.pulseq.com`
        );
      }
    }

    console.log("\n====================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\nSeed error:");
    console.error(error);

    process.exit(1);
  }
};

seedDatabase();