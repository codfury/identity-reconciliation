const Contact = require("../models/contacts");
const { Op } = require("sequelize");

const findPrimaryContact = async (column, value) => {
  let contact, primaryContact;
  contact = await Contact.findOne({
    where: { [column]: value },
    order: [["createdAt", "ASC"]],
  });

  primaryContact =
    contact === null || contact?.linkedPrecedence === "primary"
      ? contact
      : await Contact.findOne({ where: { id: contact.linkedId } });

  return primaryContact;
};

exports.getIdentity = async (req, res) => {
  try {
    let { email, phoneNumber } = req.body;

    if (email === null && phoneNumber === null)
      return res.json({ message: "email and phoneNumber both are missing" });

    if (phoneNumber !== null) phoneNumber = phoneNumber.toString();

    const existingContact = await Contact.findOne({
      where: { [Op.and]: [{ phoneNumber }, { email }] },
    });

    let primaryContactId;
    if (!existingContact) {
      const existingEmailPrimaryContact =
        email === null ? email : await findPrimaryContact("email", email);
      const existingPhonePrimaryContact =
        phoneNumber === null
          ? phoneNumber
          : await findPrimaryContact("phoneNumber", phoneNumber);

      if (!existingEmailPrimaryContact && !existingPhonePrimaryContact) {
        const newContact = await Contact.create(req.body);
        console.log("newContac", newContact);
        primaryContactId = newContact.id;
      } else if (
        existingEmailPrimaryContact?.id !== existingPhonePrimaryContact?.id
      ) {
        if (
          !existingEmailPrimaryContact ||
          existingEmailPrimaryContact?.createdAt >
            existingPhonePrimaryContact?.createdAt
        ) {
          primaryContactId = existingPhonePrimaryContact.id;
          await Contact.create({
            ...req.body,
            linkedPrecedence: "secondary",
            linkedId: existingPhonePrimaryContact.id,
          });

          if (existingEmailPrimaryContact !== null) {
            await Contact.update(
              {
                linkedPrecedence: "secondary",
                linkedId: existingPhonePrimaryContact.id,
              },
              {
                where: {
                  [Op.or]: [
                    { id: existingEmailPrimaryContact.id },
                    { linkedId: existingEmailPrimaryContact.id },
                  ],
                },
              }
            );
          }
        } else {
          primaryContactId = existingEmailPrimaryContact.id;
          await Contact.create({
            ...req.body,
            linkedPrecedence: "secondary",
            linkedId: existingEmailPrimaryContact.id,
          });
          if (existingPhonePrimaryContact !== null) {
            await Contact.update(
              {
                linkedPrecedence: "secondary",
                linkedId: existingEmailPrimaryContact.id,
              },
              {
                where: {
                  [Op.or]: [
                    { id: existingPhonePrimaryContact.id },
                    { linkedId: existingPhonePrimaryContact.id },
                  ],
                },
              }
            );
          }
        }
      } else {
        primaryContactId = existingPhonePrimaryContact.id;
        await Contact.create({
          ...req.body,
          linkedPrecedence: "secondary",
          linkedId: existingPhonePrimaryContact.id,
        });
      }
    } else {
      primaryContactId =
        existingContact.linkedId !== null
          ? existingContact.linkedId
          : existingContact.id;

      console.log(
        "existingContact.linkedId",
        existingContact.linkedId,
        existingContact.id
      );
    }

    console.log("primaryContactId", primaryContactId);
    const allContacts = await Contact.findAll({
      where: {
        [Op.or]: [{ id: primaryContactId }, { linkedId: primaryContactId }],
      },
    });

    let emails = new Set(),
      phoneNumbers = new Set(),
      secondaryContactIds = [];

    allContacts.forEach((item) => {
      if (item.email !== null) emails.add(item.email);
      if (item.phoneNumber !== null) phoneNumbers.add(item.phoneNumber);

      if (item.id != primaryContactId) secondaryContactIds.push(item.id);
    });

    res.status(200).json({
      contact: {
        primaryContatctId: primaryContactId,
        emails: [...emails],
        phoneNumbers: [...phoneNumbers],
        secondaryContactIds: secondaryContactIds,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message, success: false });
  }
};
