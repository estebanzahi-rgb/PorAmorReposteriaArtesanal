export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

// O — Open/Closed: nuevos proveedores de email se agregan implementando esta interfaz,
//     sin modificar los Use Cases de Notification
export interface EmailPort {
  send(notification: EmailNotification): Promise<void>;
}
