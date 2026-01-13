package app.yunke.pro.di

import app.yunke.pro.service.SSEService
import app.yunke.pro.service.WebService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ServiceModule {

    @Provides
    @Singleton
    fun provideWebService(): WebService {
        return WebService()
    }

    @Provides
    @Singleton
    fun provideSSEService(): SSEService {
        return SSEService()
    }

    // GraphQLService已禁用 - 改用Java后端
    // Firebase服务已禁用 - 无需崩溃报告和分析
}