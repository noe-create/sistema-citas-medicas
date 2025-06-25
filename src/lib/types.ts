export type ServiceType = 'General Medicine' | 'Pediatrics' | 'Nursing';
export type AccountType = 'Employee' | 'Corporate Affiliate' | 'Private';

export interface Patient {
  id: string;
  name: string;
  serviceType: ServiceType;
  accountType: AccountType;
  status: 'Waiting' | 'In Consultation' | 'Completed';
  checkInTime: Date;
}
