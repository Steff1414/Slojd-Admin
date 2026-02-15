// OData response wrapper
export interface NorceODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

// Products (from Products/Products)
export interface NorceProduct {
  Id: number;
  ClientId: number;
  ManufacturerId?: number;
  ManufacturerPartNo?: string;
  DefaultName: string;
  DefaultSubHeader?: string;
  DefaultDescription?: string;
  DefaultDescriptionHeader?: string;
  DefaultImagePath?: string;
  IsVariant: boolean;
  VariantId?: number;
  Alias?: string;
  DefaultTitle?: string;
  DefaultTags?: string;
}

// Product SKUs (from Products/ProductSkus)
export interface NorceProductSku {
  PartNo: string;
  ProductId: number;
  ClientId: number;
  StatusId: number;
  TypeId: number;
  EanCode?: string;
  IsPublished: boolean;
  GrossWeight?: number;
  NetWeight?: number;
  UnitOfMeasurementId?: number;
  ImagePath?: string;
}

// Customers (from Customers/Customers)
export interface NorceCustomer {
  Id: number;
  Key: string;
  ClientId: number;
  CustomerCode?: string;
  TypeId: number;
  EmailAddress?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  PhoneNumber?: string;
  CellPhoneNumber?: string;
  IsActive: boolean;
  Created?: string;
  Updated?: string;
  UseBillingAddressAsShippingAddress?: boolean;
}

// Orders (from Orders/Orders)
export interface NorceOrder {
  Id: number;
  ClientId: number;
  ApplicationId: number;
  OrderNo?: string;
  OrderDate?: string;
  StatusId: number;
  Source?: string;
  DeliveryMode?: string;
  IsPartDelivery: boolean;
  BuyerCustomerId?: number;
  BuyerCompanyId?: number;
  PayerCustomerId?: number;
  PayerCompanyId?: number;
  CurrencyCode?: string;
  Created?: string;
  Updated?: string;
}

// Query parameters for the proxy
export interface NorceQueryParams {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $top?: number;
  $skip?: number;
  $orderby?: string;
  $count?: boolean;
}
