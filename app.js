// =======================================================
// app.js - Logic for Ticket Issuance (index.html)
// ✅ ສະບັບທີ່ຖືກແກ້ໄຂ: ໃຊ້ Firebase Global Variables (Compat Mode)
// =======================================================

// 🔴 ບໍ່ມີການໃຊ້ import ອີກຕໍ່ໄປ

// 2. Firebase Configuration (🚨 ກະລຸນາແທນທີ່ດ້ວຍ Config ຂອງທ່ານເອງ!)
const firebaseConfig = {
    apiKey: "AIzaSyCHssutshGhHDvlkOiTpGCkqfsQx-RALCQ",
    authDomain: "chat-bot-7ecab.firebaseapp.com",
    databaseURL: "https://chat-bot-7ecab-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-bot-7ecab",
    storageBucket: "chat-bot-7ecab.firebasestorage.app",
    messagingSenderId: "95689786658",
    appId: "1:95689999999:web:e59a0958a2fbea2275d17b",
    measurementId: "G-Q2PMCHLTX3"
};

// 🟢 Initialization ໂດຍໃຊ້ Global Variable 'firebase'
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const ticketsCollection = db.collection("parking_tickets");

// Helper Function: Generate Unique Ticket ID
function generateTicketId(vehicleType) {
    const prefix = vehicleType === 'Car' ? 'V' : 'M';
    const date = new Date();
    const dateString = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    const randomNum = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}-${dateString}-${randomNum}`;
}

// Main Function: Handle Ticket Issuance
document.getElementById('issueTicketBtn').addEventListener('click', async () => {

    const vehicleTypeElement = document.querySelector('input[name="vehicleType"]:checked');
    const vehicleType = vehicleTypeElement ? vehicleTypeElement.value : 'Car';
    const licensePlate = document.getElementById('licensePlate').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const depositDate = document.getElementById('depositDate').value;
    const issueByStaff = document.getElementById('issueByStaff').value.trim();
    const parkingFee = parseFloat(document.getElementById('parkingFee').value) || 0;

    // ກວດສອບຄວາມຄົບຖ້ວນຂອງຂໍ້ມູນທີ່ຈຳເປັນ
    if (!customerName || !depositDate || !issueByStaff) {
        const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
        document.getElementById('modalMessage').className = 'text-danger';
        document.getElementById('modalMessage').innerHTML = '<h4><i class="bi bi-exclamation-triangle-fill me-2"></i> ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບຖ້ວນ!</h4>';
        alertModal.show();
        return;
    }

    const ticketId = generateTicketId(vehicleType);

    const ticketData = {
        ticketId: ticketId,
        vehicleType: vehicleType,
        licensePlate: licensePlate || 'N/A',
        customerName: customerName,
        depositDate: depositDate,
        // 🟢 ໃຊ້ firebase.firestore.FieldValue.serverTimestamp()
        entryTime: firebase.firestore.FieldValue.serverTimestamp(),
        issueByStaff: issueByStaff,
        parkingFee: parkingFee,
        isUsed: false,
        scanTime: null,
    };

    try {
        // 🟢 ໃຊ້ .add() ໃສ່ໃນ Collection
        await ticketsCollection.add(ticketData);

        // ສ້າງ QR Code ແລະ ສະແດງຜົນ
        const qrcodeDisplayElement = document.getElementById('qrcodeDisplay');
        qrcodeDisplayElement.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            new QRCode(qrcodeDisplayElement, {
                text: ticketId,
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        // ສະແດງຂໍ້ມູນຜົນລັບ
        document.getElementById('displayTicketId').textContent = ticketId;
        document.getElementById('displayVehicleType').textContent = vehicleType === 'Car' ? 'ລົດໃຫຍ່' : 'ລົດຈັກ';
        document.getElementById('displayDepositDate').textContent = depositDate;

        const now = new Date();
        document.getElementById('displayEntryTime').textContent = now.toLocaleTimeString('lo-LA') + ' ' + now.toLocaleDateString('lo-LA');

        document.getElementById('displayStaffName').textContent = issueByStaff;
        document.getElementById('displayFee').textContent = parkingFee.toLocaleString('lo-LA');

        document.getElementById('resultCard').style.display = 'block';

        const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
        document.getElementById('modalMessage').className = 'text-success';
        document.getElementById('modalMessage').innerHTML = '<h4><i class="bi bi-check-circle-fill me-2"></i> ອອກບັດສຳເລັດແລ້ວ!</h4>';
        alertModal.show();

        // ຈັດການຄຳເຕືອນລົດຈັກ
        const motoWarningElement = document.getElementById('motoWarning');
        if (vehicleType === 'Car') {
            motoWarningElement.style.display = 'none';
        } else {
            motoWarningElement.style.display = 'list-item';
        }

    } catch (e) {
        console.error("Error adding document: ", e);
        const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
        document.getElementById('modalMessage').className = 'text-danger';
        document.getElementById('modalMessage').innerHTML = `<h4><i class="bi bi-x-circle-fill me-2"></i> ຜິດພາດໃນການບັນທຶກ!</h4>`;
        alertModal.show();
    }
});

// Logic ສໍາລັບປຸ່ມລ້າງຂໍ້ມູນ
document.getElementById('resetFormBtn').addEventListener('click', () => {
    document.getElementById('licensePlate').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('issueByStaff').value = '';
    document.getElementById('parkingFee').value = '0';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('depositDate').valueAsDate = new Date();
});

// ຕັ້ງຄ່າເບື້ອງຕົ້ນ: ຕັ້ງວັນທີຝາກເປັນວັນທີປັດຈຸບັນ
document.addEventListener('DOMContentLoaded', () => {
    const depositDateElement = document.getElementById('depositDate');
    if (depositDateElement) {
        depositDateElement.valueAsDate = new Date();
    }
});