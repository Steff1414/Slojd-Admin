import { Badge } from '@/components/ui/badge';
import { CustomerCategory, CustomerTypeGroup, ContactType, RelationshipType } from '@/types/database';

interface CategoryBadgeProps {
  category: CustomerCategory;
}

const categoryVariants: Record<CustomerCategory, 'customer' | 'school' | 'company' | 'payer' | 'contact'> = {
  Privat: 'customer',
  Personal: 'customer',
  Företag: 'company',
  ÅF: 'company',
  UF: 'company',
  Skola: 'school',
  Omsorg: 'payer',
  Förening: 'contact',
  'Kommun och Region': 'payer',
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge variant={categoryVariants[category]}>
      {category}
    </Badge>
  );
}

interface TypeGroupBadgeProps {
  typeGroup: CustomerTypeGroup;
}

const typeGroupVariants: Record<CustomerTypeGroup, 'b2c' | 'b2b' | 'b2g'> = {
  B2C: 'b2c',
  B2B: 'b2b',
  B2G: 'b2g',
};

export function TypeGroupBadge({ typeGroup }: TypeGroupBadgeProps) {
  return (
    <Badge variant={typeGroupVariants[typeGroup]}>
      {typeGroup}
    </Badge>
  );
}

interface ContactTypeBadgeProps {
  contactType: ContactType;
}

const contactTypeVariants: Record<ContactType, 'contact' | 'teacher' | 'company' | 'customer'> = {
  Privatperson: 'customer',
  Medlem: 'customer',
  Nyhetsbrev: 'contact',
  Lärare: 'teacher',
  Köpare: 'company',
  Övrig: 'contact',
};

export function ContactTypeBadge({ contactType }: ContactTypeBadgeProps) {
  return (
    <Badge variant={contactTypeVariants[contactType]}>
      {contactType}
    </Badge>
  );
}

interface RelationshipBadgeProps {
  relationshipType: RelationshipType;
}

const relationshipLabels: Record<RelationshipType, string> = {
  TeacherAtSchool: 'Lärare',
  BuyerAtCompany: 'Inköpare',
  PrimaryContact: 'Primär kontakt',
  Employee: 'Anställd',
  Other: 'Övrigt',
};

export function RelationshipBadge({ relationshipType }: RelationshipBadgeProps) {
  return (
    <Badge variant="secondary">
      {relationshipLabels[relationshipType]}
    </Badge>
  );
}
