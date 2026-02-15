// OData response wrapper
export interface NorceODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

// Products
export interface NorceProduct {
  ProductId: number;
  Name: string;
  SubHeader?: string;
  Code: string;
  ManufacturerCode?: string;
  StatusId?: number;
  IsActive: boolean;
  Created?: string;
  Updated?: string;
  Description?: string;
  DescriptionHeader?: string;
  UniqueName?: string;
  CategoryId?: number;
  CategoryName?: string;
  Skus?: NorceProductSku[];
  PriceLists?: NorcePriceListItem[];
}

// Product SKUs
export interface NorceProductSku {
  SkuId: number;
  ProductId: number;
  PartNo: string;
  ManufacturerPartNo?: string;
  Name?: string;
  EanCode?: string;
  StatusId?: number;
  IsActive: boolean;
  StockLevel?: number;
  PriceLists?: NorcePriceListItem[];
}

export interface NorcePriceListItem {
  PriceListId: number;
  Price: number;
  PriceOriginal?: number;
  Currency?: string;
  IsActive: boolean;
}

// Customers
export interface NorceCustomer {
  CustomerId: number;
  Code?: string;
  Name?: string;
  Email?: string;
  Phone?: string;
  OrgNo?: string;
  IsActive: boolean;
  Created?: string;
  Updated?: string;
  CustomerType?: number;
  Address1?: string;
  Address2?: string;
  City?: string;
  ZipCode?: string;
  Country?: string;
}

// Orders
export interface NorceOrder {
  OrderId: number;
  OrderNo?: string;
  OrderDate?: string;
  StatusId?: number;
  CustomerId?: number;
  CustomerName?: string;
  PaymentStatusId?: number;
  OrderTotal?: number;
  Currency?: string;
  Created?: string;
  Updated?: string;
  OrderItems?: NorceOrderItem[];
}

export interface NorceOrderItem {
  OrderItemId: number;
  OrderId: number;
  ProductId?: number;
  ProductName?: string;
  PartNo?: string;
  Quantity: number;
  Price: number;
  LineTotal: number;
}

// Categories
export interface NorceCategory {
  CategoryId: number;
  ParentCategoryId?: number;
  Name: string;
  Code?: string;
  Description?: string;
  SortOrder?: number;
  IsActive: boolean;
  Level?: number;
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
