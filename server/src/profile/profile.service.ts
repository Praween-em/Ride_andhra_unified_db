import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { Driver } from './entities/driver.entity';
import { DriverDocument, DocumentType, DocumentStatus } from './entities/driver-document.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { UpdateDriverStatusDto } from './dto/update-status.dto';
import { DriverSubscription } from './entities/driver-subscription.entity';
import { MoreThan } from 'typeorm';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(DriverDocument)
    private readonly driverDocumentRepository: Repository<DriverDocument>,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(DriverSubscription)
    private readonly subscriptionRepository: Repository<DriverSubscription>,
  ) { }

  async getEarnings(userId: string) {
    // Get driver ID (which is the user ID in our schema)
    const driverId = userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Helper to get earnings for a date range
    const getEarningsForRange = async (start: Date, end: Date) => {
      const result = await this.rideRepository
        .createQueryBuilder('ride')
        .select('SUM(ride.fare)', 'total')
        .where('ride.driver_id = :driverId', { driverId })
        .andWhere('ride.status = :status', { status: 'completed' })
        .andWhere('ride.created_at >= :start', { start })
        .andWhere('ride.created_at <= :end', { end })
        .getRawOne();
      return parseFloat(result.total || '0');
    };

    // Helper to get daily breakdown
    const getDailyBreakdown = async (start: Date, days: number) => {
      const breakdown = [];
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(start);
        dayStart.setDate(start.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const amount = await getEarningsForRange(dayStart, dayEnd);
        breakdown.push(amount);
      }
      return breakdown;
    };

    // 1. Today's Earnings (Morning, Afternoon, Evening breakdown)
    const todayEarnings = await getEarningsForRange(today, new Date());
    // For simplicity, we'll just split equally or use 0 for now as we don't have hourly data easily without more complex queries
    // A better approach for charts:
    const todayBreakdown = [0, 0, 0]; // Placeholder for Morning, Afternoon, Evening

    // 2. Weekly Earnings
    const weekEarnings = await getEarningsForRange(weekStart, new Date());
    const weekBreakdown = await getDailyBreakdown(weekStart, 7);

    // 3. Monthly Earnings
    const monthEarnings = await getEarningsForRange(monthStart, new Date());
    const monthBreakdown = [0, 0, 0, 0]; // Placeholder for 4 weeks

    return {
      today: {
        amount: todayEarnings,
        labels: ['Morning', 'Afternoon', 'Evening'],
        datasets: [{ data: todayBreakdown }]
      },
      week: {
        amount: weekEarnings,
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{ data: weekBreakdown }]
      },
      month: {
        amount: monthEarnings,
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{ data: monthBreakdown }]
      }
    };
  }

  async getDriverEarnings(userId: string) {
    // Wrapper method to match controller expectations
    return this.getEarnings(userId);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const driver = await this.driverRepository.findOne({ where: { user_id: userId } });

    // Fetch profile image document ID
    const profileImageDoc = await this.driverDocumentRepository.findOne({
      where: {
        driverId: userId,
        documentType: DocumentType.PROFILE_IMAGE
      },
      select: ['id']
    });

    // Construct avatar URL if document exists
    // Note: We'll use the API base URL from the client side, so we just return the relative path or ID
    const avatarUrl = profileImageDoc ? `/profile/documents/image/${profileImageDoc.id}` : null;

    // Fetch active subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        driverId: userId,
        status: 'active',
        endDate: MoreThan(new Date())
      },
      order: {
        endDate: 'DESC'
      }
    });

    return {
      id: user.id,
      name: user.name,
      phone_number: user.phone_number,
      roles: user.roles,
      is_verified: user.is_verified,
      driver_id: driver?.user_id || null,
      driver_status: driver?.status || null,
      message: 'Driver profile retrieved successfully',
      profile: {
        name: user.name,
        phoneNumber: user.phone_number,
        vehicle: driver ? `${driver.vehicleModel} (${driver.vehiclePlateNumber})` : 'Not Registered',
        vehicleModel: driver?.vehicleModel,
        vehiclePlateNumber: driver?.vehiclePlateNumber,
        rating: driver?.driverRating || 5.0,
        trips: driver?.totalRides || 0,
        memberSince: new Date(user.created_at).getFullYear().toString(),
        avatar: avatarUrl,
        isOnline: driver?.isOnline || false,
        isAvailable: driver?.isAvailable || false,
        subscriptionExpiry: subscription ? subscription.endDate.toISOString() : null,
      }
    };
  }

  updateProfile(updateProfileDto: UpdateProfileDto) {
    console.log('Updating driver profile:', updateProfileDto);
    return { message: 'Driver profile updated successfully', profile: updateProfileDto };
  }

  /**
   * Normalize phone number to 10 digits without country code
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      return digitsOnly.substring(2);
    }
    if (digitsOnly.length === 10) {
      return digitsOnly;
    }
    return digitsOnly.slice(-10);
  }

  async registerDriver(
    registerDriverDto: RegisterDriverDto,
    files: {
      profilePhoto?: Express.Multer.File[],
      licenseFrontPhoto?: Express.Multer.File[],
      licenseBackPhoto?: Express.Multer.File[],
      aadhaarPhoto?: Express.Multer.File[],
      panPhoto?: Express.Multer.File[]
    }
  ) {
    const { phoneNumber, name, licenseNumber, vehicleModel, vehicleColor, vehiclePlateNumber } = registerDriverDto;

    // Normalize phone number to 10 digits
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Find or create user
    let user = await this.userRepository.findOne({ where: { phone_number: normalizedPhone } });

    if (!user) {
      // Create new user if doesn't exist
      console.log(`Creating new user for phone: ${normalizedPhone}`);
      const newUser = this.userRepository.create({
        phone_number: normalizedPhone,
        name: name,
        roles: [UserRole.RIDER, UserRole.DRIVER],
        // is_verified stays FALSE - admin will manually verify
      });
      user = await this.userRepository.save(newUser);
    } else {
      // Update existing user details and add DRIVER role if not already present
      user.name = name;
      // Add DRIVER role to roles array if not already present
      if (!user.roles.includes(UserRole.DRIVER)) {
        user.roles = Array.from(new Set([...user.roles, UserRole.DRIVER]));
      }
      // DON'T auto-verify - let admin verify
      user = await this.userRepository.save(user);
    }

    // Check if driver profile already exists
    let driver = await this.driverRepository.findOne({ where: { user_id: user.id } });

    if (!driver) {
      // Create driver profile with PENDING status
      const newDriver = this.driverRepository.create({
        user_id: user.id,
        user: user,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        vehicleModel,
        vehicleColor,
        vehiclePlateNumber,
        vehicleType: 'auto', // Default, can be updated later
        status: 'pending_approval', // Keep as pending - admin will approve
      });
      driver = await this.driverRepository.save(newDriver);
    } else {
      // Update existing driver profile but keep status as is
      driver.firstName = name.split(' ')[0];
      driver.lastName = name.split(' ').slice(1).join(' ') || '';
      driver.vehicleModel = vehicleModel;
      driver.vehicleColor = vehicleColor;
      driver.vehiclePlateNumber = vehiclePlateNumber;
      // DON'T change status - let admin approve
      driver = await this.driverRepository.save(driver);
    }

    // Create document entries in driver_documents table
    const documentsToCreate: Partial<DriverDocument>[] = [];

    // 1. Profile Photo
    if (files.profilePhoto?.[0]) {
      const file = files.profilePhoto[0];
      documentsToCreate.push({
        driverId: driver.user_id,
        documentType: DocumentType.PROFILE_IMAGE,
        documentImage: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: DocumentStatus.PENDING,
      });
    }

    // 2. License Front Photo
    if (files.licenseFrontPhoto?.[0]) {
      const file = files.licenseFrontPhoto[0];
      documentsToCreate.push({
        driverId: driver.user_id,
        documentType: DocumentType.LICENSE,
        documentImage: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        documentNumber: licenseNumber,
        status: DocumentStatus.PENDING,
      });
    }

    // 3. License Back Photo
    if (files.licenseBackPhoto?.[0]) {
      const file = files.licenseBackPhoto[0];
      documentsToCreate.push({
        driverId: driver.user_id,
        documentType: DocumentType.LICENSE_BACK,
        documentImage: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        documentNumber: licenseNumber,
        status: DocumentStatus.PENDING,
      });
    }

    // 4. Aadhar Photo
    if (files.aadhaarPhoto?.[0]) {
      const file = files.aadhaarPhoto[0];
      documentsToCreate.push({
        driverId: driver.user_id,
        documentType: DocumentType.AADHAR,
        documentImage: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        documentNumber: '', // Can be added to DTO later
        status: DocumentStatus.PENDING,
      });
    }

    // 5. PAN Photo
    if (files.panPhoto?.[0]) {
      const file = files.panPhoto[0];
      documentsToCreate.push({
        driverId: driver.user_id,
        documentType: DocumentType.PAN,
        documentImage: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: DocumentStatus.PENDING,
      });
    }

    if (documentsToCreate.length > 0) {
      await this.driverDocumentRepository.save(documentsToCreate);
    }

    console.log(`📝 Driver registered (pending approval): ${driver.user_id}`);

    return {
      message: 'Driver registered successfully. Awaiting admin verification.',
      driverId: driver.user_id,
      status: 'pending_approval'
    };
  }

  async updateDriverStatus(userId: string, updateDriverStatusDto: UpdateDriverStatusDto) {
    console.log('🔍 updateDriverStatus called:', { userId, dto: updateDriverStatusDto });

    const driver = await this.driverRepository.findOne({ where: { user: { id: userId } } });

    if (!driver) {
      console.error('❌ Driver not found for userId:', userId);
      throw new NotFoundException('Driver not found');
    }

    console.log('📊 Driver BEFORE update:', {
      user_id: driver.user_id,
      isOnline: driver.isOnline,
      currentLat: driver.currentLatitude,
      currentLng: driver.currentLongitude
    });

    driver.isOnline = updateDriverStatusDto.online;

    // Only update location if it's provided in the request
    if (updateDriverStatusDto.location) {
      driver.currentLatitude = updateDriverStatusDto.location.latitude;
      driver.currentLongitude = updateDriverStatusDto.location.longitude;
      driver.currentLocation = {
        type: 'Point',
        coordinates: [updateDriverStatusDto.location.longitude, updateDriverStatusDto.location.latitude],
      };
    }

    console.log('📊 Driver AFTER setting values:', {
      user_id: driver.user_id,
      isOnline: driver.isOnline,
      currentLat: driver.currentLatitude,
      currentLng: driver.currentLongitude
    });

    const savedDriver = await this.driverRepository.save(driver);

    console.log('✅ Driver SAVED to database:', {
      user_id: savedDriver.user_id,
      isOnline: savedDriver.isOnline,
      currentLat: savedDriver.currentLatitude,
      currentLng: savedDriver.currentLongitude
    });

    return { message: 'Driver status updated successfully' };
  }

  async updatePushToken(userId: string, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.pushToken = token;
    await this.userRepository.save(user);
    return { message: 'Push token updated successfully' };
  }

  // ==================== DOCUMENT MANAGEMENT METHODS ====================

  /**
   * Upload or update a single driver document
   */
  async uploadDocument(
    driverId: string,
    uploadDocumentDto: UploadDocumentDto,
    file: Express.Multer.File
  ) {
    // Verify driver exists
    const driver = await this.driverRepository.findOne({ where: { user_id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check if document already exists
    const existingDocument = await this.driverDocumentRepository.findOne({
      where: {
        driverId,
        documentType: uploadDocumentDto.documentType,
      },
    });

    if (existingDocument) {
      // Update existing document
      existingDocument.documentImage = file.buffer;
      existingDocument.fileName = file.originalname;
      existingDocument.mimeType = file.mimetype;
      existingDocument.fileSize = file.size;
      existingDocument.documentNumber = uploadDocumentDto.documentNumber;
      existingDocument.expiryDate = uploadDocumentDto.expiryDate ? new Date(uploadDocumentDto.expiryDate) : undefined;
      existingDocument.status = DocumentStatus.PENDING; // Reset to pending when re-uploaded
      existingDocument.verifiedBy = undefined;
      existingDocument.verifiedAt = undefined;
      existingDocument.rejectionReason = undefined;

      await this.driverDocumentRepository.save(existingDocument);
      return { message: 'Document updated successfully', document: existingDocument };
    } else {
      // Create new document
      const newDocument = this.driverDocumentRepository.create({
        driverId,
        documentType: uploadDocumentDto.documentType,
        documentImage: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        documentNumber: uploadDocumentDto.documentNumber,
        expiryDate: uploadDocumentDto.expiryDate ? new Date(uploadDocumentDto.expiryDate) : undefined,
        status: DocumentStatus.PENDING,
      });

      const savedDocument = await this.driverDocumentRepository.save(newDocument);
      return { message: 'Document uploaded successfully', document: savedDocument };
    }
  }

  /**
   * Get all documents for a driver
   */
  async getDriverDocuments(driverId: string) {
    const driver = await this.driverRepository.findOne({ where: { user_id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const documents = await this.driverDocumentRepository.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });

    return documents;
  }

  /**
   * Get a specific document by type
   */
  async getDocument(driverId: string, documentType: DocumentType) {
    const document = await this.driverDocumentRepository.findOne({
      where: { driverId, documentType },
    });

    if (!document) {
      throw new NotFoundException(`${documentType} document not found for this driver`);
    }

    return document;
  }

  /**
   * Verify or reject a document (Admin only)
   */
  async verifyDocument(
    documentId: string,
    verifyDocumentDto: VerifyDocumentDto,
    verifiedBy: string
  ) {
    const document = await this.driverDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (verifyDocumentDto.status === DocumentStatus.REJECTED && !verifyDocumentDto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting a document');
    }

    document.status = verifyDocumentDto.status;
    document.verifiedBy = verifiedBy;
    document.verifiedAt = new Date();
    document.rejectionReason = verifyDocumentDto.rejectionReason;

    await this.driverDocumentRepository.save(document);

    return { message: `Document ${verifyDocumentDto.status} successfully`, document };
  }

  /**
   * Get documents by status (for admin dashboard)
   */
  async getDocumentsByStatus(status: DocumentStatus) {
    const documents = await this.driverDocumentRepository.find({
      where: { status },
      relations: ['driver', 'driver.user'],
      order: { createdAt: 'DESC' },
    });

    return documents;
  }

  /**
   * Get all pending documents (for admin review)
   */
  async getPendingDocuments() {
    return this.getDocumentsByStatus(DocumentStatus.PENDING);
  }

  /**
   * Check if driver has all required documents approved
   */
  async hasAllDocumentsApproved(driverId: string): Promise<boolean> {
    const requiredDocuments = [DocumentType.AADHAR, DocumentType.LICENSE];

    const approvedDocuments = await this.driverDocumentRepository.count({
      where: {
        driverId,
        documentType: requiredDocuments as any,
        status: DocumentStatus.APPROVED,
      },
    });

    return approvedDocuments === requiredDocuments.length;
  }

  /**
   * Get document by ID (for image retrieval)
   */
  async getDocumentById(documentId: string) {
    return this.driverDocumentRepository.findOne({
      where: { id: documentId },
    });
  }
}
