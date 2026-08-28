export interface StorageService {
  /**
   * Saves a file to the storage provider and returns the relative public URL path.
   * @param file The file object containing buffer, mimetype, originalname, size.
   * @param folder Target subdirectory inside uploads (e.g. 'products' or 'variants')
   */
  saveFile(file: { buffer: Buffer; mimetype: string; originalname: string; size: number }, folder: string): Promise<string>;

  /**
   * Deletes a file from the storage provider by its public path.
   * @param fileUrl The relative public path or complete URL of the file.
   */
  deleteFile(fileUrl: string): Promise<void>;
}
