import { Controller, Get, Post, Body, Patch, UseInterceptors, UploadedFiles, UploadedFile, Put, Req, UseGuards, Param, Query, Res } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as multer from 'multer';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { UpdateDriverStatusDto } from './dto/update-status.dto';
import { DocumentType, DocumentStatus } from './entities/driver-document.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

// Configure multer to use memory storage for BLOB uploads
const multerOptions = {
  storage: multer.memoryStorage(),
};

@UseGuards(JwtAuthGuard) // Added
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @Get()
  getProfile(@Req() req) {
    return this.profileService.getProfile(req.user.userId);
  }

  @Patch()
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(updateProfileDto);
  }

  @Post('register-driver')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'licenseFrontPhoto', maxCount: 1 },
    { name: 'licenseBackPhoto', maxCount: 1 },
    { name: 'aadhaarPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
  ], multerOptions))
  async registerDriver(
    @UploadedFiles() files: {
      profilePhoto?: Express.Multer.File[],
      licenseFrontPhoto?: Express.Multer.File[],
      licenseBackPhoto?: Express.Multer.File[],
      aadhaarPhoto?: Express.Multer.File[],
      panPhoto?: Express.Multer.File[]
    },
    @Body() registerDriverDto: RegisterDriverDto
  ) {
    try {
      console.log('📝 Registration request received:', { ...registerDriverDto, files: Object.keys(files) });
      const result = await this.profileService.registerDriver(registerDriverDto, files);
      console.log('✅ Registration successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  @Put('driver/status')
  async updateDriverStatus(@Body() updateDriverStatusDto: UpdateDriverStatusDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.profileService.updateDriverStatus(userId, updateDriverStatusDto);
  }

  @Put('push-token')
  async updatePushToken(@Body() body: { token: string }, @Req() req: any) {
    const userId = req.user.userId;
    return this.profileService.updatePushToken(userId, body.token);
  }

  @Get('earnings')
  async getEarnings(@Req() req: any) {
    const userId = req.user.userId;
    return this.profileService.getDriverEarnings(userId);
  }

  // ==================== DOCUMENT MANAGEMENT ENDPOINTS ====================

  /**
   * Upload a single driver document
   * POST /profile/documents/:driverId
   */
  @Post('documents/:driverId')
  @UseInterceptors(FileInterceptor('document', multerOptions))
  async uploadDocument(
    @Param('driverId') driverId: string,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.profileService.uploadDocument(driverId, uploadDocumentDto, file);
  }

  /**
   * Get document image
   * GET /profile/documents/image/:documentId
   */
  @Get('documents/image/:documentId')
  async getDocumentImage(
    @Param('documentId') documentId: string,
    @Res() res: Response
  ) {
    const document = await this.profileService.getDocumentById(documentId);

    if (!document || !document.documentImage) {
      return res.status(404).json({ message: 'Document image not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType || 'image/jpeg');
    res.setHeader('Content-Length', document.fileSize || document.documentImage.length);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName || 'document.jpg'}"`);

    // Send the image buffer
    res.send(document.documentImage);
  }

  /**
   * Get all documents for a driver
   * GET /profile/documents/:driverId
   */
  @Get('documents/:driverId')
  async getDriverDocuments(@Param('driverId') driverId: string) {
    return this.profileService.getDriverDocuments(driverId);
  }

  /**
   * Get a specific document by type
   * GET /profile/documents/:driverId/:documentType
   */
  @Get('documents/:driverId/:documentType')
  async getDocument(
    @Param('driverId') driverId: string,
    @Param('documentType') documentType: DocumentType
  ) {
    return this.profileService.getDocument(driverId, documentType);
  }

  /**
   * Verify or reject a document (Admin only)
   * PATCH /profile/documents/:documentId/verify
   */
  @Patch('documents/:documentId/verify')
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() verifyDocumentDto: VerifyDocumentDto,
    @Req() req: any
  ) {
    const verifiedBy = req.user.userId;
    return this.profileService.verifyDocument(documentId, verifyDocumentDto, verifiedBy);
  }

  /**
   * Get documents by status (Admin endpoint)
   * GET /profile/admin/documents?status=pending
   */
  @Get('admin/documents')
  async getDocumentsByStatus(@Query('status') status: DocumentStatus) {
    if (status) {
      return this.profileService.getDocumentsByStatus(status);
    }
    return this.profileService.getPendingDocuments();
  }

  /**
   * Get pending documents for review (Admin endpoint)
   * GET /profile/admin/documents/pending
   */
  @Get('admin/documents/pending')
  async getPendingDocuments() {
    return this.profileService.getPendingDocuments();
  }


}

