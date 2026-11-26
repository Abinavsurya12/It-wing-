import { sequelize, Constituency, Ward, User, Issue } from '../models/index.js';

async function checkKinathukadavu() {
  try {
    await sequelize.authenticate();
    const kinathu = await Constituency.findOne({
      where: {
        name: 'Kinathukadavu'
      }
    });

    console.log('Kinathukadavu Constituency:', {
      id: kinathu?.id,
      name: kinathu?.name,
      code: kinathu?.code,
      totalPaguthi: kinathu?.totalPaguthi,
      paguthis: kinathu?.paguthis,
    });

    const wards = await Ward.findAll({
      where: { constituencyId: kinathu?.id },
      attributes: ['id', 'wardNumber', 'wardName', 'paguthi', 'village', 'wardSecretary', 'contactNumber']
    });

    console.log(`\nFound ${wards.length} wards mapped to Kinathukadavu constituency:`);
    wards.forEach(w => {
      console.log(`- Ward ${w.wardNumber}: "${w.wardName}" | Paguthi: "${w.paguthi}" | Village: "${w.village}" | Sec: "${w.wardSecretary}" (${w.contactNumber})`);
    });

    const nagaramWards = await Ward.findAll({
      where: { paguthi: 'Kinathukadavu Nagaram' }
    });
    console.log(`\nFound ${nagaramWards.length} wards specifically with paguthi 'Kinathukadavu Nagaram'`);

    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkKinathukadavu();
