import QRCode from "qrcode";

export async function generateTicketQRCode(ticketData: {
  ticketNumber: string;
  bookingRef: string;
  movieTitle: string;
  cinemaName: string;
  auditoriumName: string;
  showtime: string;
  seatLabel: string;
}): Promise<string> {
  const qrPayload = JSON.stringify({
    cinebook_pass_id: ticketData.ticketNumber,
    ref: ticketData.bookingRef,
    movie: ticketData.movieTitle,
    cinema: ticketData.cinemaName,
    screen: ticketData.auditoriumName,
    time: ticketData.showtime,
    seat: ticketData.seatLabel,
    security_hash: Buffer.from(`${ticketData.ticketNumber}:${ticketData.bookingRef}`).toString("base64"),
  });

  try {
    const dataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#0a0e17",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (error) {
    console.error("QR Code generation error:", error);
    return "";
  }
}
