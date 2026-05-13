export interface MpPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
}

export interface MpPreferenceParams {
  orderId: string;
  items: MpPreferenceItem[];
  payerEmail: string;
}

export interface MpPaymentInfo {
  status: string;
  externalReference: string;
}

export interface MpGatewayPort {
  createPreference(params: MpPreferenceParams): Promise<{ initPoint: string }>;
  getPayment(paymentId: string): Promise<MpPaymentInfo>;
}
